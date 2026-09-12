-- ==============================================================================
-- WECA DATABASE SCHEMA (Phase 1: Foundation & Core Feed)
-- Tables: profiles, posts, likes, comments, storage.buckets('posts')
-- Fully idempotent: safe to run repeatedly in the Supabase SQL Editor.
-- ==============================================================================

-- 0. Clean Migration: If legacy prototype tables exist with image_id, drop them
do $$
begin
  if exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'likes' and column_name = 'image_id'
  ) then
    drop table if exists public.likes cascade;
  end if;

  if exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'comments' and column_name = 'image_id'
  ) then
    drop table if exists public.comments cascade;
  end if;

  if exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'battles' and column_name = 'image_a'
  ) then
    drop table if exists public.battles cascade;
  end if;
end $$;

-- 1. Profiles Table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  avatar_url text,
  bio text,
  credits_balance int default 0,
  created_at timestamptz default now()
);

-- Ensure all columns exist if table was already created
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists credits_balance int default 0;

-- 2. Posts Table (Weirdness & Uniqueness scores calculated asynchronously by Phase 2 AI scoring)
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  image_url text not null,
  caption text,
  weirdness_score int,
  uniqueness_score int,
  scoring_status text default 'scoring', -- 'scoring', 'completed', 'failed'
  created_at timestamptz default now()
);

alter table public.posts add column if not exists scoring_status text default 'scoring';

-- 3. Likes Table (Unique on user_id + post_id)
create table if not exists public.likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (post_id, user_id)
);

-- 4. Comments Table
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz default now()
);

-- Indexes for optimal feed performance
create index if not exists idx_posts_created_at on public.posts (created_at desc);
create index if not exists idx_posts_user_id on public.posts (user_id);
create index if not exists idx_likes_post_id on public.likes (post_id);
create index if not exists idx_likes_user_id on public.likes (user_id);
create index if not exists idx_comments_post_id on public.comments (post_id);
create index if not exists idx_comments_created_at on public.comments (created_at asc);

-- 5. Storage Bucket for Post Images
insert into storage.buckets (id, name, public)
values ('posts', 'posts', true)
on conflict (id) do update set public = true;

-- Storage Policies (Drop then recreate for idempotency)
drop policy if exists "Public post photos are viewable by everyone" on storage.objects;
create policy "Public post photos are viewable by everyone"
  on storage.objects for select
  using ( bucket_id = 'posts' );

drop policy if exists "Authenticated users can upload post photos" on storage.objects;
create policy "Authenticated users can upload post photos"
  on storage.objects for insert
  with check ( bucket_id = 'posts' and auth.role() = 'authenticated' );

drop policy if exists "Users can delete own post photos" on storage.objects;
create policy "Users can delete own post photos"
  on storage.objects for delete
  using ( bucket_id = 'posts' and auth.uid()::text = (storage.foldername(name))[1] );

-- 6. Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;

-- Profiles Policies
drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Posts Policies
drop policy if exists "Posts are viewable by everyone" on public.posts;
create policy "Posts are viewable by everyone"
  on public.posts for select
  using (true);

drop policy if exists "Authenticated users can create posts" on public.posts;
create policy "Authenticated users can create posts"
  on public.posts for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own posts" on public.posts;
create policy "Users can update own posts"
  on public.posts for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own posts" on public.posts;
create policy "Users can delete own posts"
  on public.posts for delete
  using (auth.uid() = user_id);

-- Likes Policies
drop policy if exists "Likes are viewable by everyone" on public.likes;
create policy "Likes are viewable by everyone"
  on public.likes for select
  using (true);

drop policy if exists "Authenticated users can like posts" on public.likes;
create policy "Authenticated users can like posts"
  on public.likes for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can remove own like" on public.likes;
create policy "Users can remove own like"
  on public.likes for delete
  using (auth.uid() = user_id);

-- Comments Policies
drop policy if exists "Comments are viewable by everyone" on public.comments;
create policy "Comments are viewable by everyone"
  on public.comments for select
  using (true);

drop policy if exists "Authenticated users can post comments" on public.comments;
create policy "Authenticated users can post comments"
  on public.comments for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own comments" on public.comments;
create policy "Users can delete own comments"
  on public.comments for delete
  using (auth.uid() = user_id);

-- 7. Automatic Profile Creation Trigger on Auth Sign-Up
create or replace function public.handle_new_user()
returns trigger as $$
declare
  raw_username text;
begin
  raw_username := coalesce(
    new.raw_user_meta_data->>'username',
    split_part(new.email, '@', 1)
  );

  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    raw_username,
    coalesce(new.raw_user_meta_data->>'display_name', raw_username),
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      'https://api.dicebear.com/7.x/initials/svg?seed=' || raw_username
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 8. Enable Supabase Realtime for live score updates on posts
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'posts'
  ) then
    alter publication supabase_realtime add table public.posts;
  end if;
exception
  when others then
    null;
end $$;

-- 9. Phase 2 Database Webhook for Asynchronous AI Scoring
-- To set up the Webhook in Supabase Dashboard:
-- 1. Go to Database -> Webhooks -> Create a webhook
-- 2. Name: "score_post_on_insert"
-- 3. Table: "posts", Events: "Insert"
-- 4. Type: Supabase Edge Function (or HTTP Request to your deployment /api/score-post)
-- 5. Method: POST, Function: "score-post"

-- ==============================================================================
-- 10. WECA PHASE 3: VS BATTLES & VOTING
-- Tables: battles, battle_votes
-- ==============================================================================

-- 10.1 Battles Table
create table if not exists public.battles (
  id uuid primary key default gen_random_uuid(),
  post_a_id uuid not null references public.posts(id) on delete cascade,
  post_b_id uuid not null references public.posts(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'ended')),
  winner_post_id uuid references public.posts(id) on delete set null,
  vote_threshold int default 50,
  created_at timestamptz default now(),
  ended_at timestamptz,
  constraint check_different_posts check (post_a_id != post_b_id)
);

-- Ensure all columns exist for idempotency
alter table public.battles add column if not exists winner_post_id uuid references public.posts(id) on delete set null;
alter table public.battles add column if not exists vote_threshold int default 50;
alter table public.battles add column if not exists ended_at timestamptz;

-- 10.2 Battle Votes Table
create table if not exists public.battle_votes (
  id uuid primary key default gen_random_uuid(),
  battle_id uuid not null references public.battles(id) on delete cascade,
  voter_id uuid not null references public.profiles(id) on delete cascade,
  voted_for_post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz default now(),
  constraint unique_battle_voter unique (battle_id, voter_id)
);

-- Indexes for performance
create index if not exists idx_battles_status on public.battles(status);
create index if not exists idx_battles_created_at on public.battles(created_at desc);
create index if not exists idx_battles_created_by on public.battles(created_by);
create index if not exists idx_battle_votes_battle_id on public.battle_votes(battle_id);
create index if not exists idx_battle_votes_voter_id on public.battle_votes(voter_id);

-- 10.3 Row Level Security
alter table public.battles enable row level security;
alter table public.battle_votes enable row level security;

-- Battles RLS
drop policy if exists "Battles are viewable by everyone" on public.battles;
create policy "Battles are viewable by everyone"
  on public.battles for select
  using (true);

drop policy if exists "Authenticated users can create battles" on public.battles;
create policy "Authenticated users can create battles"
  on public.battles for insert
  with check (auth.uid() = created_by);

drop policy if exists "Creators can update own battles" on public.battles;
create policy "Creators can update own battles"
  on public.battles for update
  using (auth.uid() = created_by);

-- Battle Votes RLS
drop policy if exists "Battle votes are viewable by everyone" on public.battle_votes;
create policy "Battle votes are viewable by everyone"
  on public.battle_votes for select
  using (true);

drop policy if exists "Authenticated non-creators can vote once on active battles" on public.battle_votes;
create policy "Authenticated non-creators can vote once on active battles"
  on public.battle_votes for insert
  with check (
    auth.uid() = voter_id
    and auth.uid() != (select created_by from public.battles where id = battle_id)
    and (select status from public.battles where id = battle_id) = 'active'
  );

-- 10.4 Auto-End Battle Trigger Function
create or replace function public.check_battle_auto_end()
returns trigger as $$
declare
  b_record record;
  votes_count int;
  votes_a int;
  votes_b int;
  winner uuid;
begin
  select * into b_record from public.battles where id = new.battle_id;
  if not found or b_record.status = 'ended' then
    return new;
  end if;

  select count(*) into votes_count from public.battle_votes where battle_id = new.battle_id;
  
  if votes_count >= coalesce(b_record.vote_threshold, 50) then
    select count(*) into votes_a from public.battle_votes where battle_id = new.battle_id and voted_for_post_id = b_record.post_a_id;
    select count(*) into votes_b from public.battle_votes where battle_id = new.battle_id and voted_for_post_id = b_record.post_b_id;

    if votes_a > votes_b then
      winner := b_record.post_a_id;
    elsif votes_b > votes_a then
      winner := b_record.post_b_id;
    else
      winner := null; -- tie
    end if;

    update public.battles
    set status = 'ended',
        winner_post_id = winner,
        ended_at = now()
    where id = new.battle_id;
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists tr_check_battle_auto_end on public.battle_votes;
create trigger tr_check_battle_auto_end
  after insert on public.battle_votes
  for each row execute procedure public.check_battle_auto_end();

-- 10.5 Realtime for Battles & Votes
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'battles'
  ) then
    alter publication supabase_realtime add table public.battles;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'battle_votes'
  ) then
    alter publication supabase_realtime add table public.battle_votes;
  end if;
exception
  when others then
    null;
end $$;

-- ==============================================================================
-- 11. WECA PHASE 4: CREDITS, MONETIZATION & PAYOUTS
-- Tables: credit_transactions, payout_requests
-- ==============================================================================

-- Add is_admin column to profiles if not exists
alter table public.profiles add column if not exists is_admin boolean default false;

-- 11.1 Credit Transactions Table (Immutable audit trail)
create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount int not null,
  reason text not null,
  post_id uuid references public.posts(id) on delete set null,
  battle_id uuid references public.battles(id) on delete set null,
  payout_request_id uuid,
  created_at timestamptz default now()
);

create index if not exists idx_credit_transactions_user_id on public.credit_transactions(user_id);
create index if not exists idx_credit_transactions_created_at on public.credit_transactions(created_at desc);
create index if not exists idx_credit_transactions_post_id on public.credit_transactions(post_id);
create index if not exists idx_credit_transactions_battle_id on public.credit_transactions(battle_id);

-- 11.2 Payout Requests Table
create table if not exists public.payout_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount int not null check (amount > 0),
  currency text not null default 'INR',
  status text not null default 'pending' check (status in ('pending', 'approved', 'paid', 'rejected')),
  payout_details jsonb not null,
  risk_score int default 0,
  flagged_suspicious boolean default false,
  suspicion_reasons text[] default array[]::text[],
  admin_notes text,
  razorpayx_payout_id text,
  requested_at timestamptz default now(),
  processed_at timestamptz,
  processed_by uuid references public.profiles(id) on delete set null
);

create index if not exists idx_payout_requests_user_id on public.payout_requests(user_id);
create index if not exists idx_payout_requests_status on public.payout_requests(status);
create index if not exists idx_payout_requests_requested_at on public.payout_requests(requested_at desc);

-- 11.3 RLS Policies for Credit Transactions & Payout Requests
alter table public.credit_transactions enable row level security;
alter table public.payout_requests enable row level security;

-- Users can view their own credit transactions; admins view all
drop policy if exists "Users can view own credit transactions" on public.credit_transactions;
create policy "Users can view own credit transactions"
  on public.credit_transactions for select
  using (auth.uid() = user_id or (select coalesce(is_admin, false) from public.profiles where id = auth.uid()));

-- Authenticated users or service role can insert credit transactions
drop policy if exists "Authenticated users can insert credit transactions" on public.credit_transactions;
create policy "Authenticated users can insert credit transactions"
  on public.credit_transactions for insert
  with check (auth.uid() = user_id or auth.role() = 'service_role');

-- Users can view their own payout requests; admins can view all
drop policy if exists "Users view own payout requests" on public.payout_requests;
create policy "Users view own payout requests"
  on public.payout_requests for select
  using (auth.uid() = user_id or (select coalesce(is_admin, false) from public.profiles where id = auth.uid()));

-- Users can insert their own payout requests
drop policy if exists "Users insert own payout requests" on public.payout_requests;
create policy "Users insert own payout requests"
  on public.payout_requests for insert
  with check (auth.uid() = user_id);

-- Admins can update payout requests
drop policy if exists "Admins update payout requests" on public.payout_requests;
create policy "Admins update payout requests"
  on public.payout_requests for update
  using ((select coalesce(is_admin, false) from public.profiles where id = auth.uid()) or auth.role() = 'service_role');

-- 11.4 Atomic Credit Modification Procedure
create or replace function public.apply_credit_change(
  p_user_id uuid,
  p_amount int,
  p_reason text,
  p_post_id uuid default null,
  p_battle_id uuid default null,
  p_payout_request_id uuid default null
)
returns table(new_balance int, transaction_id uuid) as $$
declare
  t_id uuid;
  updated_balance int;
begin
  insert into public.credit_transactions (
    user_id,
    amount,
    reason,
    post_id,
    battle_id,
    payout_request_id
  )
  values (
    p_user_id,
    p_amount,
    p_reason,
    p_post_id,
    p_battle_id,
    p_payout_request_id
  )
  returning id into t_id;

  update public.profiles
  set credits_balance = coalesce(credits_balance, 0) + p_amount
  where id = p_user_id
  returning credits_balance into updated_balance;

  return query select updated_balance, t_id;
end;
$$ language plpgsql security definer;

-- 11.5 Auto-End Battle Trigger Update with Winner Bonus
create or replace function public.check_battle_auto_end()
returns trigger as $$
declare
  b_record record;
  votes_count int;
  votes_a int;
  votes_b int;
  winner uuid;
  winner_user_id uuid;
  bonus_already_awarded boolean;
begin
  select * into b_record from public.battles where id = new.battle_id;
  if not found or b_record.status = 'ended' then
    return new;
  end if;

  select count(*) into votes_count from public.battle_votes where battle_id = new.battle_id;
  
  if votes_count >= coalesce(b_record.vote_threshold, 50) then
    select count(*) into votes_a from public.battle_votes where battle_id = new.battle_id and voted_for_post_id = b_record.post_a_id;
    select count(*) into votes_b from public.battle_votes where battle_id = new.battle_id and voted_for_post_id = b_record.post_b_id;

    if votes_a > votes_b then
      winner := b_record.post_a_id;
    elsif votes_b > votes_a then
      winner := b_record.post_b_id;
    else
      winner := null;
    end if;

    update public.battles
    set status = 'ended',
        winner_post_id = winner,
        ended_at = now()
    where id = new.battle_id;

    if winner is not null then
      select user_id into winner_user_id from public.posts where id = winner;
      if winner_user_id is not null then
        select exists (
          select 1 from public.credit_transactions
          where battle_id = new.battle_id and reason like '%Battle Victory Bonus%'
        ) into bonus_already_awarded;

        if not bonus_already_awarded then
          perform public.apply_credit_change(
            winner_user_id,
            50,
            'Versus Battle Victory Bonus: Post crowned winner',
            winner,
            new.battle_id,
            null
          );
        end if;
      end if;
    end if;
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- 11.6 Webhook Event Deduplication Table
create table if not exists public.processed_webhook_events (
  event_id text primary key,
  event_type text not null,
  payload jsonb,
  processed_at timestamptz default now()
);

alter table public.processed_webhook_events enable row level security;
drop policy if exists "Service role can manage webhook events" on public.processed_webhook_events;
create policy "Service role can manage webhook events"
  on public.processed_webhook_events for all
  using (true) with check (true);