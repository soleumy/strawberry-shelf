-- Strawberry Shelf - Phase 1: Create Tables Only
-- Execute this FIRST, then run 002_rls_policies.sql

-- Enable pgcrypto for gen_random_uuid()
create extension if not exists pgcrypto;

-- Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  full_name text,
  bio text,
  country text,
  avatar_url text,
  banner_url text,
  social jsonb,
  is_admin boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  total_novels int default 0,
  total_chapters int default 0,
  followers_count int default 0,
  following_count int default 0,
  favorites_count int default 0,
  reads_count bigint default 0
);

-- Novels
create table if not exists public.novels (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  slug text unique not null,
  description text,
  cover_url text,
  translator text,
  status text,
  language text,
  genres text[],
  tags text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  published_at timestamptz,
  views bigint default 0,
  favorites_count int default 0,
  comments_count int default 0,
  ratings_count int default 0,
  average_rating numeric(3,2) default 0
);

-- Chapters
create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  novel_id uuid not null references public.novels(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text,
  content text,
  chapter_index int default 0,
  is_draft boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  published_at timestamptz
);

-- Favorites
create table if not exists public.favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  novel_id uuid not null references public.novels(id) on delete cascade,
  created_at timestamptz default now(),
  primary key(user_id, novel_id)
);

-- Reading list (library states)
create table if not exists public.reading_list (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  novel_id uuid not null references public.novels(id) on delete cascade,
  status text not null,
  created_at timestamptz default now(),
  unique(user_id, novel_id)
);

-- Collections
create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  cover_url text,
  is_public boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.collection_items (
  collection_id uuid not null references public.collections(id) on delete cascade,
  novel_id uuid not null references public.novels(id) on delete cascade,
  item_index int default 0,
  primary key(collection_id, novel_id)
);

-- Followers
create table if not exists public.followers (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key(follower_id, following_id)
);

-- Comments
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  novel_id uuid not null references public.novels(id) on delete cascade,
  chapter_id uuid references public.chapters(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  content text not null,
  is_edited boolean default false,
  is_reported boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Ratings
create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  novel_id uuid not null references public.novels(id) on delete cascade,
  chapter_id uuid references public.chapters(id) on delete cascade,
  score int not null check (score >= 1 and score <= 5),
  created_at timestamptz default now()
);

-- Notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id),
  type text not null,
  data jsonb,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- Reading history
create table if not exists public.reading_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  novel_id uuid not null references public.novels(id) on delete cascade,
  chapter_id uuid references public.chapters(id),
  last_read_at timestamptz default now(),
  position numeric,
  percent numeric
);

-- Reports
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null,
  target_id uuid not null,
  reason text,
  status text default 'open',
  created_at timestamptz default now()
);

-- Messages (private)
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- Activity feed
create table if not exists public.activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type IN ('new_chapter','new_novel','favorite','follow','comment')),
  reference_id text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Create indexes for performance
create index if not exists idx_novels_author on public.novels(author_id);
create index if not exists idx_chapters_novel on public.chapters(novel_id);
create index if not exists idx_comments_novel on public.comments(novel_id);
create index if not exists idx_activity_user on public.activity(user_id, created_at desc);
create index if not exists idx_followers_following on public.followers(following_id);
create index if not exists idx_reading_history_user on public.reading_history(user_id);

-- End of Phase 1
