-- ==============================================================================
-- WECA MIGRATION 004: GEOTAGS & ANOMALY CATEGORIZATION FOR WORLD MAP
-- Adds geospatial coordinates, city, country, and category to posts table.
-- Fully idempotent: safe to execute repeatedly in Supabase.
-- ==============================================================================

alter table public.posts add column if not exists category text default 'Other';
alter table public.posts add column if not exists city text;
alter table public.posts add column if not exists country text;
alter table public.posts add column if not exists latitude double precision;
alter table public.posts add column if not exists longitude double precision;

-- Composite spatial index for geo queries
create index if not exists idx_posts_lat_lng on public.posts (latitude, longitude) where latitude is not null and longitude is not null;
create index if not exists idx_posts_category on public.posts (category);
create index if not exists idx_posts_country on public.posts (country);
