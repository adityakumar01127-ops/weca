-- ==============================================================================
-- WECA PHASE 5: EARNINGS, MONETIZATION & CREATOR ELIGIBILITY SYSTEM
-- Migration 003: follows, impressions, creator eligibility, login streaks,
--                achievements, daily earning caps
-- Fully idempotent: safe to run repeatedly.
-- ==============================================================================

-- ============================================================
-- 1. FOLLOWS TABLE
-- ============================================================
create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, following_id),
  constraint no_self_follow check (follower_id != following_id)
);

create index if not exists idx_follows_follower on public.follows(follower_id);
create index if not exists idx_follows_following on public.follows(following_id);
create index if not exists idx_follows_created_at on public.follows(created_at desc);

alter table public.follows enable row level security;

drop policy if exists "Follows are viewable by everyone" on public.follows;
create policy "Follows are viewable by everyone"
  on public.follows for select using (true);

drop policy if exists "Users can follow others" on public.follows;
create policy "Users can follow others"
  on public.follows for insert
  with check (auth.uid() = follower_id);

drop policy if exists "Users can unfollow" on public.follows;
create policy "Users can unfollow"
  on public.follows for delete
  using (auth.uid() = follower_id);

-- ============================================================
-- 2. PROFILE COLUMNS FOR EARNINGS
-- ============================================================
alter table public.profiles add column if not exists follower_count int default 0;
alter table public.profiles add column if not exists following_count int default 0;
alter table public.profiles add column if not exists total_impressions bigint default 0;
alter table public.profiles add column if not exists creator_status text default 'viewer';

-- ============================================================
-- 3. FOLLOWER COUNT TRIGGERS
-- ============================================================
create or replace function public.handle_follow_insert()
returns trigger as $$
begin
  update public.profiles
    set follower_count = coalesce(follower_count, 0) + 1
    where id = new.following_id;
  update public.profiles
    set following_count = coalesce(following_count, 0) + 1
    where id = new.follower_id;
  return new;
end;
$$ language plpgsql security definer;

create or replace function public.handle_follow_delete()
returns trigger as $$
begin
  update public.profiles
    set follower_count = greatest(0, coalesce(follower_count, 0) - 1)
    where id = old.following_id;
  update public.profiles
    set following_count = greatest(0, coalesce(following_count, 0) - 1)
    where id = old.follower_id;
  return old;
end;
$$ language plpgsql security definer;

drop trigger if exists tr_follow_insert on public.follows;
create trigger tr_follow_insert
  after insert on public.follows
  for each row execute procedure public.handle_follow_insert();

drop trigger if exists tr_follow_delete on public.follows;
create trigger tr_follow_delete
  after delete on public.follows
  for each row execute procedure public.handle_follow_delete();

-- ============================================================
-- 4. POST IMPRESSIONS TABLE
-- ============================================================
create table if not exists public.post_impressions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  viewer_id uuid not null references public.profiles(id) on delete cascade,
  impression_type text not null check (impression_type in ('view', 'dwell_3s', 'share', 'save')),
  impression_date date not null default current_date,
  created_at timestamptz default now()
);

-- Ensure impression_date column exists if table was created in a previous run
alter table public.post_impressions add column if not exists impression_date date not null default current_date;

-- Deduplicate: one impression type per viewer per post per day via immutable column index
drop index if exists public.idx_impression_dedup;
create unique index if not exists idx_impression_dedup
  on public.post_impressions(post_id, viewer_id, impression_type, impression_date);

create index if not exists idx_impressions_post on public.post_impressions(post_id);
create index if not exists idx_impressions_viewer on public.post_impressions(viewer_id);
create index if not exists idx_impressions_created on public.post_impressions(created_at desc);

alter table public.post_impressions enable row level security;

drop policy if exists "Impressions are viewable by post owner" on public.post_impressions;
create policy "Impressions are viewable by post owner"
  on public.post_impressions for select
  using (
    viewer_id = auth.uid()
    or exists (
      select 1 from public.posts where id = post_id and user_id = auth.uid()
    )
    or (select coalesce(is_admin, false) from public.profiles where id = auth.uid())
  );

drop policy if exists "Authenticated users can record impressions" on public.post_impressions;
create policy "Authenticated users can record impressions"
  on public.post_impressions for insert
  with check (auth.uid() = viewer_id);

-- ============================================================
-- 5. CREATOR ELIGIBILITY TABLE
-- ============================================================
create table if not exists public.creator_eligibility (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'eligible', 'suspended')),
  qualified_posts_count int default 0,
  follower_count int default 0,
  total_impressions bigint default 0,
  enrollment_date timestamptz default now(),
  qualification_date timestamptz,
  deadline_date timestamptz,
  last_checked_at timestamptz default now(),
  moderation_strikes int default 0
);

alter table public.creator_eligibility enable row level security;

drop policy if exists "Users can view own eligibility" on public.creator_eligibility;
create policy "Users can view own eligibility"
  on public.creator_eligibility for select
  using (
    auth.uid() = user_id
    or (select coalesce(is_admin, false) from public.profiles where id = auth.uid())
  );

drop policy if exists "Users can enroll themselves" on public.creator_eligibility;
create policy "Users can enroll themselves"
  on public.creator_eligibility for insert
  with check (auth.uid() = user_id);

drop policy if exists "System can update eligibility" on public.creator_eligibility;
create policy "System can update eligibility"
  on public.creator_eligibility for update
  using (
    auth.uid() = user_id
    or auth.role() = 'service_role'
    or (select coalesce(is_admin, false) from public.profiles where id = auth.uid())
  );

-- ============================================================
-- 6. DAILY EARNING CAPS TABLE
-- ============================================================
create table if not exists public.daily_earning_caps (
  user_id uuid not null references public.profiles(id) on delete cascade,
  cap_date date not null default current_date,
  interaction_wc_earned numeric(10,1) default 0,
  total_wc_earned numeric(10,1) default 0,
  primary key (user_id, cap_date)
);

create index if not exists idx_daily_caps_date on public.daily_earning_caps(cap_date desc);

alter table public.daily_earning_caps enable row level security;

drop policy if exists "Users can view own daily caps" on public.daily_earning_caps;
create policy "Users can view own daily caps"
  on public.daily_earning_caps for select
  using (
    auth.uid() = user_id
    or (select coalesce(is_admin, false) from public.profiles where id = auth.uid())
  );

drop policy if exists "System manages daily caps" on public.daily_earning_caps;
create policy "System manages daily caps"
  on public.daily_earning_caps for all
  using (auth.uid() = user_id or auth.role() = 'service_role')
  with check (auth.uid() = user_id or auth.role() = 'service_role');

-- ============================================================
-- 7. LOGIN STREAKS TABLE
-- ============================================================
create table if not exists public.login_streaks (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  current_streak int default 0,
  longest_streak int default 0,
  last_login_date date,
  last_bonus_claimed_date date,
  total_bonus_earned int default 0
);

alter table public.login_streaks enable row level security;

drop policy if exists "Users can view own streak" on public.login_streaks;
create policy "Users can view own streak"
  on public.login_streaks for select
  using (auth.uid() = user_id);

drop policy if exists "Users can manage own streak" on public.login_streaks;
create policy "Users can manage own streak"
  on public.login_streaks for all
  using (auth.uid() = user_id or auth.role() = 'service_role')
  with check (auth.uid() = user_id or auth.role() = 'service_role');

-- ============================================================
-- 8. ACHIEVEMENTS TABLE
-- ============================================================
create table if not exists public.achievements_unlocked (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  achievement_id text not null,
  wc_awarded int not null default 0,
  unlocked_at timestamptz default now(),
  constraint unique_achievement_per_user unique (user_id, achievement_id)
);

create index if not exists idx_achievements_user on public.achievements_unlocked(user_id);
create index if not exists idx_achievements_id on public.achievements_unlocked(achievement_id);

alter table public.achievements_unlocked enable row level security;

drop policy if exists "Users can view own achievements" on public.achievements_unlocked;
create policy "Users can view own achievements"
  on public.achievements_unlocked for select
  using (
    auth.uid() = user_id
    or (select coalesce(is_admin, false) from public.profiles where id = auth.uid())
  );

drop policy if exists "System can unlock achievements" on public.achievements_unlocked;
create policy "System can unlock achievements"
  on public.achievements_unlocked for insert
  with check (auth.uid() = user_id or auth.role() = 'service_role');

-- ============================================================
-- 9. ATOMIC INTERACTION CREDIT FUNCTION
-- Awards WC to a creator for a viewer interaction, enforcing:
--   1. Creator eligibility check
--   2. No self-interaction
--   3. Daily cap enforcement (500 WC/day from interactions)
-- ============================================================
create or replace function public.apply_interaction_credit(
  p_creator_id uuid,
  p_viewer_id uuid,
  p_amount numeric(10,1),
  p_reason text,
  p_post_id uuid default null,
  p_daily_cap numeric(10,1) default 500.0
)
returns table(success boolean, new_balance int, daily_used numeric(10,1), capped boolean) as $$
declare
  creator_elig_status text;
  today date := current_date;
  current_daily numeric(10,1);
  remaining numeric(10,1);
  actual_amount numeric(10,1);
  updated_balance int;
  is_capped boolean := false;
begin
  -- 1. Prevent self-interaction
  if p_creator_id = p_viewer_id then
    return query select false, 0, 0.0::numeric(10,1), false;
    return;
  end if;

  -- 2. Check creator eligibility
  select ce.status into creator_elig_status
  from public.creator_eligibility ce
  where ce.user_id = p_creator_id;

  if creator_elig_status is null or creator_elig_status != 'eligible' then
    return query select false, 0, 0.0::numeric(10,1), false;
    return;
  end if;

  -- 3. Check daily cap
  insert into public.daily_earning_caps (user_id, cap_date, interaction_wc_earned, total_wc_earned)
  values (p_creator_id, today, 0, 0)
  on conflict (user_id, cap_date) do nothing;

  select interaction_wc_earned into current_daily
  from public.daily_earning_caps
  where user_id = p_creator_id and cap_date = today;

  remaining := p_daily_cap - coalesce(current_daily, 0);
  if remaining <= 0 then
    return query select false, 0, coalesce(current_daily, 0)::numeric(10,1), true;
    return;
  end if;

  actual_amount := least(p_amount, remaining);
  is_capped := actual_amount < p_amount;

  -- 4. Award credits atomically
  insert into public.credit_transactions (user_id, amount, reason, post_id)
  values (p_creator_id, ceil(actual_amount)::int, p_reason, p_post_id);

  update public.profiles
  set credits_balance = coalesce(credits_balance, 0) + ceil(actual_amount)::int
  where id = p_creator_id
  returning credits_balance into updated_balance;

  -- 5. Update daily cap usage
  update public.daily_earning_caps
  set interaction_wc_earned = coalesce(interaction_wc_earned, 0) + actual_amount,
      total_wc_earned = coalesce(total_wc_earned, 0) + actual_amount
  where user_id = p_creator_id and cap_date = today;

  return query select true, coalesce(updated_balance, 0),
    (coalesce(current_daily, 0) + actual_amount)::numeric(10,1),
    is_capped;
end;
$$ language plpgsql security definer;

-- ============================================================
-- 10. RECORD IMPRESSION FUNCTION (with dedup + profile update)
-- ============================================================
create or replace function public.record_impression(
  p_post_id uuid,
  p_viewer_id uuid,
  p_impression_type text
)
returns boolean as $$
declare
  post_owner_id uuid;
begin
  select user_id into post_owner_id from public.posts where id = p_post_id;
  if post_owner_id is null then return false; end if;

  if post_owner_id = p_viewer_id then return false; end if;

  begin
    insert into public.post_impressions (post_id, viewer_id, impression_type, impression_date)
    values (p_post_id, p_viewer_id, p_impression_type, current_date);
  exception when unique_violation then
    return false;
  end;

  update public.profiles
  set total_impressions = coalesce(total_impressions, 0) + 1
  where id = post_owner_id;

  update public.creator_eligibility
  set total_impressions = coalesce(total_impressions, 0) + 1,
      last_checked_at = now()
  where user_id = post_owner_id;

  return true;
end;
$$ language plpgsql security definer;

-- ============================================================
-- 11. CHECK & UPDATE CREATOR ELIGIBILITY FUNCTION
-- ============================================================
create or replace function public.check_and_update_eligibility(
  p_user_id uuid
)
returns table(is_eligible boolean, posts_count int, followers int, impressions bigint, deadline timestamptz) as $$
declare
  elig_record record;
  actual_posts int;
  actual_followers int;
  actual_impressions bigint;
  now_ts timestamptz := now();
begin
  select * into elig_record from public.creator_eligibility where user_id = p_user_id;

  if not found then
    return query select false, 0, 0, 0::bigint, null::timestamptz;
    return;
  end if;

  if elig_record.status = 'eligible' then
    return query select true,
      elig_record.qualified_posts_count,
      elig_record.follower_count,
      elig_record.total_impressions,
      elig_record.deadline_date;
    return;
  end if;

  if elig_record.status = 'suspended' then
    return query select false,
      elig_record.qualified_posts_count,
      elig_record.follower_count,
      elig_record.total_impressions,
      elig_record.deadline_date;
    return;
  end if;

  select count(*) into actual_posts
  from public.posts
  where user_id = p_user_id
    and scoring_status = 'completed'
    and coalesce(weirdness_score, 0) >= 30;

  select coalesce(p.follower_count, 0) into actual_followers
  from public.profiles p where p.id = p_user_id;

  select coalesce(p.total_impressions, 0) into actual_impressions
  from public.profiles p where p.id = p_user_id;

  update public.creator_eligibility
  set qualified_posts_count = actual_posts,
      follower_count = actual_followers,
      total_impressions = actual_impressions,
      last_checked_at = now_ts
  where user_id = p_user_id;

  if actual_posts >= 5
    and actual_followers >= 1000
    and actual_impressions >= 100000
    and (elig_record.deadline_date is null or now_ts <= elig_record.deadline_date)
    and elig_record.moderation_strikes = 0
  then
    update public.creator_eligibility
    set status = 'eligible', qualification_date = now_ts
    where user_id = p_user_id;

    update public.profiles
    set creator_status = 'eligible'
    where id = p_user_id;

    return query select true, actual_posts, actual_followers, actual_impressions, elig_record.deadline_date;
  else
    return query select false, actual_posts, actual_followers, actual_impressions, elig_record.deadline_date;
  end if;
end;
$$ language plpgsql security definer;

-- ============================================================
-- 12. LOGIN STREAK CLAIM FUNCTION
-- ============================================================
create or replace function public.claim_daily_login_bonus(
  p_user_id uuid
)
returns table(streak int, bonus_wc int, already_claimed boolean) as $$
declare
  streak_record record;
  today date := current_date;
  yesterday date := current_date - 1;
  new_streak int;
  bonus int;
begin
  insert into public.login_streaks (user_id, current_streak, longest_streak, last_login_date)
  values (p_user_id, 0, 0, null)
  on conflict (user_id) do nothing;

  select * into streak_record from public.login_streaks where user_id = p_user_id;

  if streak_record.last_bonus_claimed_date = today then
    return query select streak_record.current_streak, 0, true;
    return;
  end if;

  if streak_record.last_login_date = yesterday then
    new_streak := coalesce(streak_record.current_streak, 0) + 1;
  elsif streak_record.last_login_date = today then
    new_streak := coalesce(streak_record.current_streak, 1);
  else
    new_streak := 1;
  end if;

  if new_streak >= 31 then
    bonus := 15;
  elsif new_streak >= 8 then
    bonus := 10;
  else
    bonus := 5;
  end if;

  update public.login_streaks
  set current_streak = new_streak,
      longest_streak = greatest(coalesce(longest_streak, 0), new_streak),
      last_login_date = today,
      last_bonus_claimed_date = today,
      total_bonus_earned = coalesce(total_bonus_earned, 0) + bonus
  where user_id = p_user_id;

  perform public.apply_credit_change(
    p_user_id,
    bonus,
    'Daily Login Streak Bonus (Day ' || new_streak || ')',
    null, null, null
  );

  return query select new_streak, bonus, false;
end;
$$ language plpgsql security definer;

-- ============================================================
-- 13. ACHIEVEMENT UNLOCK FUNCTION
-- ============================================================
create or replace function public.unlock_achievement(
  p_user_id uuid,
  p_achievement_id text,
  p_wc_reward int
)
returns table(newly_unlocked boolean, wc_awarded int) as $$
declare
  already_exists boolean;
begin
  select exists (
    select 1 from public.achievements_unlocked
    where user_id = p_user_id and achievement_id = p_achievement_id
  ) into already_exists;

  if already_exists then
    return query select false, 0;
    return;
  end if;

  insert into public.achievements_unlocked (user_id, achievement_id, wc_awarded)
  values (p_user_id, p_achievement_id, p_wc_reward);

  perform public.apply_credit_change(
    p_user_id,
    p_wc_reward,
    'Achievement Unlocked: ' || p_achievement_id,
    null, null, null
  );

  return query select true, p_wc_reward;
end;
$$ language plpgsql security definer;

-- ============================================================
-- 14. REALTIME SUBSCRIPTIONS FOR NEW TABLES
-- ============================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'follows'
  ) then
    alter publication supabase_realtime add table public.follows;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'creator_eligibility'
  ) then
    alter publication supabase_realtime add table public.creator_eligibility;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'login_streaks'
  ) then
    alter publication supabase_realtime add table public.login_streaks;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'achievements_unlocked'
  ) then
    alter publication supabase_realtime add table public.achievements_unlocked;
  end if;
exception
  when others then null;
end $$;
