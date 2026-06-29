-- Strawberry Shelf - Phase 2: Row Level Security Policies
-- Execute this AFTER 001_create_tables.sql

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.novels enable row level security;
alter table public.chapters enable row level security;
alter table public.favorites enable row level security;
alter table public.reading_list enable row level security;
alter table public.collections enable row level security;
alter table public.collection_items enable row level security;
alter table public.followers enable row level security;
alter table public.comments enable row level security;
alter table public.ratings enable row level security;
alter table public.notifications enable row level security;
alter table public.reading_history enable row level security;
alter table public.reports enable row level security;
alter table public.messages enable row level security;
alter table public.activity enable row level security;

-- ============================================================
-- PROFILES
-- ============================================================
drop policy if exists "profiles_insert" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_select" on public.profiles;

create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_select" on public.profiles for select using (true);

-- ============================================================
-- NOVELS
-- ============================================================
drop policy if exists "novels_select" on public.novels;
drop policy if exists "novels_insert" on public.novels;
drop policy if exists "novels_update" on public.novels;
drop policy if exists "novels_delete" on public.novels;

create policy "novels_select" on public.novels for select using (true);
create policy "novels_insert" on public.novels for insert with check (auth.uid() = author_id);
create policy "novels_update" on public.novels for update using (
  auth.uid() = author_id or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
);
create policy "novels_delete" on public.novels for delete using (
  auth.uid() = author_id or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
);

-- ============================================================
-- CHAPTERS
-- ============================================================
drop policy if exists "chapters_select" on public.chapters;
drop policy if exists "chapters_insert" on public.chapters;
drop policy if exists "chapters_update" on public.chapters;
drop policy if exists "chapters_delete" on public.chapters;

create policy "chapters_select" on public.chapters for select using (not is_draft or auth.uid() = author_id);
create policy "chapters_insert" on public.chapters for insert with check (auth.uid() = author_id);
create policy "chapters_update" on public.chapters for update using (
  auth.uid() = author_id or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
);
create policy "chapters_delete" on public.chapters for delete using (
  auth.uid() = author_id or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
);

-- ============================================================
-- FAVORITES
-- ============================================================
drop policy if exists "favorites_insert" on public.favorites;
drop policy if exists "favorites_delete" on public.favorites;
drop policy if exists "favorites_select" on public.favorites;

create policy "favorites_insert" on public.favorites for insert with check (auth.uid() = user_id);
create policy "favorites_delete" on public.favorites for delete using (auth.uid() = user_id);
create policy "favorites_select" on public.favorites for select using (true);

-- ============================================================
-- READING LIST
-- ============================================================
drop policy if exists "reading_list_insert" on public.reading_list;
drop policy if exists "reading_list_delete" on public.reading_list;
drop policy if exists "reading_list_select" on public.reading_list;

create policy "reading_list_insert" on public.reading_list for insert with check (auth.uid() = user_id);
create policy "reading_list_delete" on public.reading_list for delete using (auth.uid() = user_id);
create policy "reading_list_select" on public.reading_list for select using (auth.uid() = user_id);

-- ============================================================
-- COLLECTIONS
-- ============================================================
drop policy if exists "collections_insert" on public.collections;
drop policy if exists "collections_update" on public.collections;
drop policy if exists "collections_delete" on public.collections;
drop policy if exists "collections_select" on public.collections;

create policy "collections_insert" on public.collections for insert with check (auth.uid() = owner_id);
create policy "collections_update" on public.collections for update using (auth.uid() = owner_id);
create policy "collections_delete" on public.collections for delete using (auth.uid() = owner_id);
create policy "collections_select" on public.collections for select using (
  is_public = true or auth.uid() = owner_id or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
);

-- ============================================================
-- COLLECTION ITEMS
-- ============================================================
drop policy if exists "collection_items_insert" on public.collection_items;
drop policy if exists "collection_items_delete" on public.collection_items;
drop policy if exists "collection_items_select" on public.collection_items;

create policy "collection_items_insert" on public.collection_items for insert with check (
  exists (select 1 from public.collections c where c.id = collection_id and c.owner_id = auth.uid())
);
create policy "collection_items_delete" on public.collection_items for delete using (
  exists (select 1 from public.collections c where c.id = collection_id and c.owner_id = auth.uid())
);
create policy "collection_items_select" on public.collection_items for select using (
  exists (select 1 from public.collections c where c.id = collection_id and (c.is_public = true or c.owner_id = auth.uid()))
);

-- ============================================================
-- FOLLOWERS
-- ============================================================
drop policy if exists "followers_insert" on public.followers;
drop policy if exists "followers_delete" on public.followers;
drop policy if exists "followers_select" on public.followers;

create policy "followers_insert" on public.followers for insert with check (auth.uid() = follower_id);
create policy "followers_delete" on public.followers for delete using (auth.uid() = follower_id);
create policy "followers_select" on public.followers for select using (true);

-- ============================================================
-- COMMENTS
-- ============================================================
drop policy if exists "comments_insert" on public.comments;
drop policy if exists "comments_update" on public.comments;
drop policy if exists "comments_delete" on public.comments;
drop policy if exists "comments_select" on public.comments;

create policy "comments_insert" on public.comments for insert with check (auth.uid() = user_id);
create policy "comments_update" on public.comments for update using (
  auth.uid() = user_id or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
);
create policy "comments_delete" on public.comments for delete using (
  auth.uid() = user_id or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
);
create policy "comments_select" on public.comments for select using (true);

-- ============================================================
-- RATINGS
-- ============================================================
drop policy if exists "ratings_insert" on public.ratings;
drop policy if exists "ratings_select" on public.ratings;

create policy "ratings_insert" on public.ratings for insert with check (auth.uid() = user_id);
create policy "ratings_select" on public.ratings for select using (true);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
drop policy if exists "notifications_select" on public.notifications;
drop policy if exists "notifications_insert" on public.notifications;
drop policy if exists "notifications_delete" on public.notifications;

create policy "notifications_select" on public.notifications for select using (auth.uid() = user_id);
create policy "notifications_insert" on public.notifications for insert with check (true);
create policy "notifications_delete" on public.notifications for delete using (auth.uid() = user_id);

-- ============================================================
-- READING HISTORY
-- ============================================================
drop policy if exists "reading_history_insert" on public.reading_history;
drop policy if exists "reading_history_select" on public.reading_history;

create policy "reading_history_insert" on public.reading_history for insert with check (auth.uid() = user_id);
create policy "reading_history_select" on public.reading_history for select using (auth.uid() = user_id);

-- ============================================================
-- REPORTS
-- ============================================================
drop policy if exists "reports_insert" on public.reports;
drop policy if exists "reports_select" on public.reports;

create policy "reports_insert" on public.reports for insert with check (auth.uid() = reporter_id);
create policy "reports_select" on public.reports for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
);

-- ============================================================
-- MESSAGES
-- ============================================================
drop policy if exists "messages_insert" on public.messages;
drop policy if exists "messages_select" on public.messages;

create policy "messages_insert" on public.messages for insert with check (auth.uid() = sender_id);
create policy "messages_select" on public.messages for select using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- ============================================================
-- ACTIVITY
-- ============================================================
drop policy if exists "activity_insert" on public.activity;
drop policy if exists "activity_select" on public.activity;

create policy "activity_insert" on public.activity for insert with check (auth.uid() = user_id);
create policy "activity_select" on public.activity for select using (true);

-- End of Phase 2
