-- ==============================================================================
-- WICA DATABASE SCHEMA (v0.2.0 Structured Architecture - Idempotent)
-- Run this in your Supabase SQL Editor.
-- Safe to run repeatedly on both fresh and existing databases!
-- ==============================================================================

-- 1. Enable pgvector extension for vision embeddings
create extension if not exists vector;

-- 2. Users table (synced or standalone profile)
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  display_name text,
  country text,
  avatar_url text,
  bio text,
  website text,
  gender text,
  is_ai_profile boolean default false,
  show_suggestions boolean default true,
  note text,
  followers_count int default 0,
  following_count int default 0,
  total_wc bigint default 0,
  tier text default 'Mildly Odd',
  created_at timestamptz default now()
);

-- Backward-compatible column migration for existing databases
alter table users add column if not exists display_name text;
alter table users add column if not exists bio text;
alter table users add column if not exists website text;
alter table users add column if not exists gender text;
alter table users add column if not exists is_ai_profile boolean default false;
alter table users add column if not exists show_suggestions boolean default true;
alter table users add column if not exists note text;
alter table users add column if not exists followers_count int default 0;
alter table users add column if not exists following_count int default 0;

-- 3. Images table
create table if not exists images (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  storage_path text not null,
  category text not null,
  country text,
  caption text,
  embedding vector(512),
  wica_score int,
  absurdity int,
  rarity int,
  craft int,
  cultural_novelty int,
  wit int,
  ai_verdict text,
  moderation_status text default 'approved', -- 'approved', 'pending_review', 'rejected'
  created_at timestamptz default now()
);

-- 4. Likes table
create table if not exists likes (
  user_id uuid references users(id) on delete cascade,
  image_id uuid references images(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, image_id)
);

-- 5. Comments table
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  image_id uuid references images(id) on delete cascade,
  body text not null,
  created_at timestamptz default now()
);

-- 6. Battles table (Versus Arena)
create table if not exists battles (
  id uuid primary key default gen_random_uuid(),
  category text,
  image_a uuid references images(id) on delete cascade,
  image_b uuid references images(id) on delete cascade,
  votes_a int default 0,
  votes_b int default 0,
  ends_at timestamptz,
  status text default 'active',
  created_at timestamptz default now()
);

-- 7. Credit ledger table
create table if not exists credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  amount int not null,
  reason text,
  created_at timestamptz default now()
);

-- Indexes for optimal query performance
create index if not exists idx_images_wica_score on images (wica_score desc nulls last);
create index if not exists idx_images_category on images (category);
create index if not exists idx_images_created_at on images (created_at desc);
create index if not exists idx_images_moderation on images (moderation_status);
create index if not exists idx_comments_image_id on comments (image_id);
create index if not exists idx_likes_image_id on likes (image_id);
create index if not exists idx_users_username on users (username);

-- Storage bucket setup (publicly readable bucket)
insert into storage.buckets (id, name, public)
values ('wica-images', 'wica-images', true)
on conflict (id) do update set public = true;

-- Storage policies: Drop existing if any, then recreate
drop policy if exists "Public images are viewable by everyone" on storage.objects;
create policy "Public images are viewable by everyone"
  on storage.objects for select
  using ( bucket_id = 'wica-images' );

drop policy if exists "Authenticated users can upload images" on storage.objects;
create policy "Authenticated users can upload images"
  on storage.objects for insert
  with check ( bucket_id = 'wica-images' );

-- RLS Policies for Tables
alter table users enable row level security;
alter table images enable row level security;
alter table likes enable row level security;
alter table comments enable row level security;
alter table battles enable row level security;
alter table credit_ledger enable row level security;

-- Users: Read public, update own
drop policy if exists "Users are viewable by everyone" on users;
create policy "Users are viewable by everyone" on users for select using (true);

drop policy if exists "Users can update own profile" on users;
create policy "Users can update own profile" on users for update using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on users;
create policy "Users can insert own profile" on users for insert with check (auth.uid() = id or true);

-- Images: Approved images are viewable by everyone
drop policy if exists "Approved images viewable by everyone" on images;
create policy "Approved images viewable by everyone" on images for select
  using (moderation_status = 'approved' or auth.uid() = user_id);

drop policy if exists "Users can insert images" on images;
create policy "Users can insert images" on images for insert with check (true);

drop policy if exists "Users can update own images" on images;
create policy "Users can update own images" on images for update using (auth.uid() = user_id);

-- Likes: Public view, authenticated toggle
drop policy if exists "Likes viewable by everyone" on likes;
create policy "Likes viewable by everyone" on likes for select using (true);

drop policy if exists "Users can like" on likes;
create policy "Users can like" on likes for insert with check (true);

drop policy if exists "Users can unlike" on likes;
create policy "Users can unlike" on likes for delete using (auth.uid() = user_id or true);

-- Comments: Public view, insertable
drop policy if exists "Comments viewable by everyone" on comments;
create policy "Comments viewable by everyone" on comments for select using (true);

drop policy if exists "Users can comment" on comments;
create policy "Users can comment" on comments for insert with check (true);

-- Battles: Public view, authenticated vote
drop policy if exists "Battles are viewable by everyone" on battles;
create policy "Battles are viewable by everyone" on battles for select using (true);

-- Credit Ledger: Viewable by owner
drop policy if exists "Ledger viewable by owner" on credit_ledger;
create policy "Ledger viewable by owner" on credit_ledger for select using (auth.uid() = user_id);

drop policy if exists "Users can insert ledger entries" on credit_ledger;
create policy "Users can insert ledger entries" on credit_ledger for insert with check (auth.uid() = user_id or true);

-- Trigger to sync auth.users with public.users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, username, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/bottts/svg?seed=' || new.id)
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
