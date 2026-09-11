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