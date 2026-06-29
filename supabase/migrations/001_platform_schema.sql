-- Strawberry Shelf Platform Schema
-- Run in Supabase SQL Editor. Safe to re-run (uses IF NOT EXISTS / DO blocks).

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES (extend existing)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  banner_url TEXT,
  bio TEXT,
  country TEXT,
  social_links JSONB DEFAULT '{}'::jsonb,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
  is_banned BOOLEAN DEFAULT FALSE,
  suspended_until TIMESTAMPTZ,
  settings JSONB DEFAULT '{"theme":"light","language":"es","privacy":"public"}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{"theme":"light","language":"es","privacy":"public"}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    LOWER(REGEXP_REPLACE(split_part(NEW.email, '@', 1), '[^a-z0-9_]', '', 'g'))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- NOVELS (extend existing)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.novels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  author TEXT,
  translator TEXT,
  synopsis TEXT,
  cover_url TEXT,
  slug TEXT UNIQUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('draft','pending','approved','rejected','hidden','paused','completed','cancelled')),
  publication_status TEXT DEFAULT 'ongoing' CHECK (publication_status IN ('draft','ongoing','paused','completed','cancelled')),
  source_type TEXT DEFAULT 'text' CHECK (source_type IN ('text','pdf')),
  language TEXT DEFAULT 'es',
  genres TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  view_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.novels ADD COLUMN IF NOT EXISTS translator TEXT;
ALTER TABLE public.novels ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.novels ADD COLUMN IF NOT EXISTS publication_status TEXT DEFAULT 'ongoing';
ALTER TABLE public.novels ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'es';
ALTER TABLE public.novels ADD COLUMN IF NOT EXISTS genres TEXT[] DEFAULT '{}';
ALTER TABLE public.novels ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.novels ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE public.novels ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.profiles(id);
ALTER TABLE public.novels ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE public.novels ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.novels ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Migrate legacy status values
UPDATE public.novels SET status = 'approved' WHERE status NOT IN ('draft','pending','approved','rejected','hidden','paused','completed','cancelled');

-- ============================================================
-- CHAPTERS (extend existing)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  novel_id UUID NOT NULL REFERENCES public.novels(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  file_url TEXT,
  file_type TEXT DEFAULT 'text' CHECK (file_type IN ('text','pdf')),
   chapter_order INTEGER NOT NULL DEFAULT 1,
   chapter_order_new INTEGER NOT NULL DEFAULT 0,
  is_draft BOOLEAN DEFAULT FALSE,
  word_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(novel_id, chapter_order)
);

ALTER TABLE public.chapters ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT FALSE;
ALTER TABLE public.chapters ADD COLUMN IF NOT EXISTS word_count INTEGER DEFAULT 0;
ALTER TABLE public.chapters ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE public.chapters ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE public.chapters ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================================
-- FAVORITES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  novel_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, novel_id)
);

-- novel_id is TEXT to support both UUID and local slug IDs

-- ============================================================
-- READING LIST
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reading_list (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  novel_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'want_to_read' CHECK (status IN ('reading','want_to_read','completed','paused')),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, novel_id)
);

-- ============================================================
-- READING HISTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reading_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  novel_id TEXT NOT NULL,
  chapter_id TEXT NOT NULL,
  scroll_position INTEGER DEFAULT 0,
  progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, novel_id)
);

-- ============================================================
-- COLLECTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.collection_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  novel_id TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(collection_id, novel_id)
);

-- ============================================================
-- FOLLOWERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.followers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- ============================================================
-- COMMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  novel_id TEXT NOT NULL,
  chapter_id TEXT NOT NULL,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_hidden BOOLEAN DEFAULT FALSE,
  is_edited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_chapter ON public.comments(novel_id, chapter_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON public.comments(parent_id);

-- ============================================================
-- RATINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  novel_id TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, novel_id)
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'comment','favorite','follower','novel_approved','new_chapter','message','report_resolved'
  )),
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reference_id TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read, created_at DESC);

-- ============================================================
-- MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject TEXT,
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  parent_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_recipient ON public.messages(recipient_id, is_read, created_at DESC);

-- ============================================================
-- REPORTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('comment','novel','user')),
  target_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','reviewed','resolved','dismissed')),
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ACTIVITY FEED
-- ============================================================
CREATE TABLE IF NOT EXISTS public.activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('new_chapter','new_novel','favorite','follow','comment')),
  reference_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_user ON public.activity(user_id, created_at DESC);

-- ============================================================
-- HELPER: is admin
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_moderator_or_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'moderator')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.novels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity ENABLE ROW LEVEL SECURITY;

-- PROFILES policies
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- NOVELS policies
DROP POLICY IF EXISTS "novels_select" ON public.novels;
CREATE POLICY "novels_select" ON public.novels FOR SELECT USING (
  status = 'approved'
  OR created_by = auth.uid()
  OR public.is_admin()
);

DROP POLICY IF EXISTS "novels_insert" ON public.novels;
CREATE POLICY "novels_insert" ON public.novels FOR INSERT
  WITH CHECK (auth.uid() = created_by AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "novels_update" ON public.novels;
CREATE POLICY "novels_update" ON public.novels FOR UPDATE USING (
  created_by = auth.uid() OR public.is_admin()
);

DROP POLICY IF EXISTS "novels_delete" ON public.novels;
CREATE POLICY "novels_delete" ON public.novels FOR DELETE USING (
  created_by = auth.uid() OR public.is_admin()
);

-- CHAPTERS policies
DROP POLICY IF EXISTS "chapters_select" ON public.chapters;
CREATE POLICY "chapters_select" ON public.chapters FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.novels n
    WHERE n.id = novel_id
    AND (n.status = 'approved' OR n.created_by = auth.uid() OR public.is_admin())
  )
  AND (is_draft = FALSE OR EXISTS (
    SELECT 1 FROM public.novels n WHERE n.id = novel_id AND n.created_by = auth.uid()
  ) OR public.is_admin())
);

DROP POLICY IF EXISTS "chapters_insert" ON public.chapters;
CREATE POLICY "chapters_insert" ON public.chapters FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.novels n WHERE n.id = novel_id AND (n.created_by = auth.uid() OR public.is_admin())
  ));

DROP POLICY IF EXISTS "chapters_update" ON public.chapters;
CREATE POLICY "chapters_update" ON public.chapters FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.novels n WHERE n.id = novel_id AND (n.created_by = auth.uid() OR public.is_admin()))
);

DROP POLICY IF EXISTS "chapters_delete" ON public.chapters;
CREATE POLICY "chapters_delete" ON public.chapters FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.novels n WHERE n.id = novel_id AND (n.created_by = auth.uid() OR public.is_admin()))
);

-- FAVORITES policies
DROP POLICY IF EXISTS "favorites_select" ON public.favorites;
CREATE POLICY "favorites_select" ON public.favorites FOR SELECT USING (true);

DROP POLICY IF EXISTS "favorites_insert" ON public.favorites;
CREATE POLICY "favorites_insert" ON public.favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "favorites_delete" ON public.favorites;
CREATE POLICY "favorites_delete" ON public.favorites FOR DELETE
  USING (auth.uid() = user_id);

-- READING LIST policies
DROP POLICY IF EXISTS "reading_list_all" ON public.reading_list;
CREATE POLICY "reading_list_all" ON public.reading_list FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- READING HISTORY policies
DROP POLICY IF EXISTS "reading_history_all" ON public.reading_history;
CREATE POLICY "reading_history_all" ON public.reading_history FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- COLLECTIONS policies
DROP POLICY IF EXISTS "collections_select" ON public.collections;
CREATE POLICY "collections_select" ON public.collections FOR SELECT USING (
  is_public = TRUE OR user_id = auth.uid()
);

DROP POLICY IF EXISTS "collections_modify" ON public.collections;
CREATE POLICY "collections_modify" ON public.collections FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- COLLECTION ITEMS policies
DROP POLICY IF EXISTS "collection_items_select" ON public.collection_items;
CREATE POLICY "collection_items_select" ON public.collection_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND (c.is_public OR c.user_id = auth.uid()))
);

DROP POLICY IF EXISTS "collection_items_modify" ON public.collection_items;
CREATE POLICY "collection_items_modify" ON public.collection_items FOR ALL
  USING (EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.user_id = auth.uid()));

-- FOLLOWERS policies
DROP POLICY IF EXISTS "followers_select" ON public.followers;
CREATE POLICY "followers_select" ON public.followers FOR SELECT USING (true);

DROP POLICY IF EXISTS "followers_insert" ON public.followers;
CREATE POLICY "followers_insert" ON public.followers FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "followers_delete" ON public.followers;
CREATE POLICY "followers_delete" ON public.followers FOR DELETE
  USING (auth.uid() = follower_id);

-- COMMENTS policies
DROP POLICY IF EXISTS "comments_select" ON public.comments;
CREATE POLICY "comments_select" ON public.comments FOR SELECT USING (
  is_hidden = FALSE OR user_id = auth.uid() OR public.is_moderator_or_admin()
);

DROP POLICY IF EXISTS "comments_insert" ON public.comments;
CREATE POLICY "comments_insert" ON public.comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "comments_update" ON public.comments;
CREATE POLICY "comments_update" ON public.comments FOR UPDATE
  USING (auth.uid() = user_id OR public.is_moderator_or_admin());

DROP POLICY IF EXISTS "comments_delete" ON public.comments;
CREATE POLICY "comments_delete" ON public.comments FOR DELETE
  USING (auth.uid() = user_id OR public.is_moderator_or_admin());

-- RATINGS policies
DROP POLICY IF EXISTS "ratings_select" ON public.ratings;
CREATE POLICY "ratings_select" ON public.ratings FOR SELECT USING (true);

DROP POLICY IF EXISTS "ratings_upsert" ON public.ratings;
CREATE POLICY "ratings_upsert" ON public.ratings FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- NOTIFICATIONS policies
DROP POLICY IF EXISTS "notifications_own" ON public.notifications;
CREATE POLICY "notifications_own" ON public.notifications FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- MESSAGES policies
DROP POLICY IF EXISTS "messages_select" ON public.messages;
CREATE POLICY "messages_select" ON public.messages FOR SELECT USING (
  auth.uid() = sender_id OR auth.uid() = recipient_id
);

DROP POLICY IF EXISTS "messages_insert" ON public.messages;
CREATE POLICY "messages_insert" ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "messages_update" ON public.messages;
CREATE POLICY "messages_update" ON public.messages FOR UPDATE
  USING (auth.uid() = recipient_id);

-- REPORTS policies
DROP POLICY IF EXISTS "reports_insert" ON public.reports;
CREATE POLICY "reports_insert" ON public.reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "reports_select" ON public.reports;
CREATE POLICY "reports_select" ON public.reports FOR SELECT USING (
  auth.uid() = reporter_id OR public.is_moderator_or_admin()
);

DROP POLICY IF EXISTS "reports_update" ON public.reports;
CREATE POLICY "reports_update" ON public.reports FOR UPDATE
  USING (public.is_moderator_or_admin());

-- ACTIVITY policies
DROP POLICY IF EXISTS "activity_select" ON public.activity;
CREATE POLICY "activity_select" ON public.activity FOR SELECT USING (true);

DROP POLICY IF EXISTS "activity_insert" ON public.activity;
CREATE POLICY "activity_insert" ON public.activity FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- STORAGE BUCKETS (run separately in Supabase dashboard if needed)
-- avatars, banners buckets for profile uploads
-- ============================================================
