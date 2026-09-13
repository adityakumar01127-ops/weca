-- ==============================================================================
-- WICA PRODUCTION MIGRATION 002: Performance Indexes, Atomic Functions, Scale
-- Safe to run repeatedly (idempotent). Run AFTER schema.sql (001).
-- ==============================================================================

-- ============================================================
-- 1. ATOMIC LIKE TOGGLE FUNCTION (replaces 3 sequential queries)
-- ============================================================
create or replace function public.toggle_like(
  p_post_id uuid,
  p_user_id uuid
)
returns table(liked boolean, likes_count bigint) as $$
declare
  was_liked boolean;
  new_count bigint;
begin
  -- Check if like already exists
  if exists (
    select 1 from public.likes
    where post_id = p_post_id and user_id = p_user_id
  ) then
    -- Unlike
    delete from public.likes
    where post_id = p_post_id and user_id = p_user_id;
    was_liked := false;
  else
    -- Like
    insert into public.likes (post_id, user_id)
    values (p_post_id, p_user_id)
    on conflict (post_id, user_id) do nothing;
    was_liked := true;
  end if;

  -- Get updated count
  select count(*) into new_count
  from public.likes
  where post_id = p_post_id;

  return query select was_liked, new_count;
end;
$$ language plpgsql security definer;

-- ============================================================
-- 2. PAGINATED FEED FUNCTION (cursor-based pagination)
-- ============================================================
create or replace function public.get_feed_paginated(
  p_limit int default 20,
  p_cursor timestamptz default null,
  p_user_id uuid default null
)
returns table(
  id uuid,
  user_id uuid,
  image_url text,
  caption text,
  weirdness_score int,
  uniqueness_score int,
  scoring_status text,
  created_at timestamptz,
  author_id uuid,
  author_username text,
  author_display_name text,
  author_avatar_url text,
  likes_count bigint,
  comments_count bigint,
  user_has_liked boolean
) as $$
begin
  return query
  select
    p.id,
    p.user_id,
    p.image_url,
    p.caption,
    p.weirdness_score,
    p.uniqueness_score,
    p.scoring_status,
    p.created_at,
    pr.id as author_id,
    pr.username as author_username,
    pr.display_name as author_display_name,
    pr.avatar_url as author_avatar_url,
    (select count(*) from public.likes l where l.post_id = p.id) as likes_count,
    (select count(*) from public.comments c where c.post_id = p.id) as comments_count,
    case when p_user_id is not null then
      exists(select 1 from public.likes l where l.post_id = p.id and l.user_id = p_user_id)
    else false end as user_has_liked
  from public.posts p
  join public.profiles pr on pr.id = p.user_id
  where (p_cursor is null or p.created_at < p_cursor)
  order by p.created_at desc
  limit p_limit;
end;
$$ language plpgsql security definer;

-- ============================================================
-- 3. USER POSTS PAGINATED FUNCTION
-- ============================================================
create or replace function public.get_user_posts_paginated(
  p_target_user_id uuid,
  p_limit int default 20,
  p_cursor timestamptz default null,
  p_current_user_id uuid default null
)
returns table(
  id uuid,
  user_id uuid,
  image_url text,
  caption text,
  weirdness_score int,
  uniqueness_score int,
  scoring_status text,
  created_at timestamptz,
  likes_count bigint,
  comments_count bigint,
  user_has_liked boolean
) as $$
begin
  return query
  select
    p.id,
    p.user_id,
    p.image_url,
    p.caption,
    p.weirdness_score,
    p.uniqueness_score,
    p.scoring_status,
    p.created_at,
    (select count(*) from public.likes l where l.post_id = p.id) as likes_count,
    (select count(*) from public.comments c where c.post_id = p.id) as comments_count,
    case when p_current_user_id is not null then
      exists(select 1 from public.likes l where l.post_id = p.id and l.user_id = p_current_user_id)
    else false end as user_has_liked
  from public.posts p
  where p.user_id = p_target_user_id
    and (p_cursor is null or p.created_at < p_cursor)
  order by p.created_at desc
  limit p_limit;
end;
$$ language plpgsql security definer;

-- ============================================================
-- 4. PERFORMANCE INDEXES FOR SCALE
-- ============================================================

-- Composite index for keyset (cursor-based) pagination on feed
create index if not exists idx_posts_created_at_id
  on public.posts (created_at desc, id);

-- Composite index for user profile feed
create index if not exists idx_posts_user_created
  on public.posts (user_id, created_at desc);

-- Index for fast like count aggregation
create index if not exists idx_likes_post_id_covering
  on public.likes (post_id) include (user_id);

-- Index for fast comment count aggregation
create index if not exists idx_comments_post_id_covering
  on public.comments (post_id) include (id);

-- Index for credit transaction lookups by post (idempotency checks)
create index if not exists idx_credit_tx_post_id
  on public.credit_transactions (post_id)
  where post_id is not null;

-- Index for credit transaction lookups by battle
create index if not exists idx_credit_tx_battle_id
  on public.credit_transactions (battle_id)
  where battle_id is not null;

-- Index for payout abuse guard queries
create index if not exists idx_battle_votes_voter_created
  on public.battle_votes (voter_id, created_at desc);

-- Index for battle vote aggregation
create index if not exists idx_battle_votes_battle_post
  on public.battle_votes (battle_id, voted_for_post_id);

-- ============================================================
-- 5. LEADERBOARD MATERIALIZED VIEW (avoids full table scans)
-- ============================================================
-- Drop and recreate for idempotency
drop materialized view if exists public.leaderboard_rankings;

create materialized view public.leaderboard_rankings as
select
  pr.id,
  pr.username,
  pr.display_name,
  pr.avatar_url,
  pr.credits_balance,
  pr.created_at,
  count(distinct p.id) as posts_count,
  coalesce(sum(
    case when p.weirdness_score is not null and p.uniqueness_score is not null
    then (p.weirdness_score + p.uniqueness_score) / 2.0
    else 0 end
  ), 0) as total_score,
  coalesce(avg(
    case when p.weirdness_score is not null and p.uniqueness_score is not null
    then (p.weirdness_score + p.uniqueness_score) / 2.0
    else null end
  ), 0) as avg_score,
  (select count(*) from public.battle_votes bv where bv.voter_id = pr.id) as votes_cast,
  rank() over (order by pr.credits_balance desc) as rank
from public.profiles pr
left join public.posts p on p.user_id = pr.id
group by pr.id, pr.username, pr.display_name, pr.avatar_url, pr.credits_balance, pr.created_at
order by pr.credits_balance desc;

-- Index for fast lookups
create unique index if not exists idx_leaderboard_id
  on public.leaderboard_rankings (id);
create index if not exists idx_leaderboard_rank
  on public.leaderboard_rankings (rank);

-- ============================================================
-- 6. REFRESH LEADERBOARD FUNCTION (call periodically or on-demand)
-- ============================================================
create or replace function public.refresh_leaderboard()
returns void as $$
begin
  refresh materialized view concurrently public.leaderboard_rankings;
end;
$$ language plpgsql security definer;

-- ============================================================
-- 7. POST COUNT STATS FUNCTION (lightweight)
-- ============================================================
create or replace function public.get_post_stats(p_post_id uuid, p_user_id uuid default null)
returns table(likes_count bigint, comments_count bigint, user_has_liked boolean) as $$
begin
  return query
  select
    (select count(*) from public.likes where post_id = p_post_id),
    (select count(*) from public.comments where post_id = p_post_id),
    case when p_user_id is not null then
      exists(select 1 from public.likes where post_id = p_post_id and user_id = p_user_id)
    else false end;
end;
$$ language plpgsql security definer;
