-- ==============================================================================
-- GURUKUL FOOTBALL ACADEMY (GURUKUL FC) - DATABASE SCHEMA & RLS SECURITY POLICIES
-- PostgreSQL / Supabase
-- ==============================================================================

-- 1. Create Posts Table
CREATE TABLE IF NOT EXISTS public.posts (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Academy News',
  tag TEXT DEFAULT 'General',
  read_time TEXT DEFAULT '4 min read',
  date TEXT NOT NULL,
  author_name TEXT NOT NULL DEFAULT 'Coach Aryan Sharma',
  author_role TEXT DEFAULT 'Head of Youth Development (UEFA B)',
  author_avatar TEXT DEFAULT '/assets/gurukul-logo.png',
  image TEXT NOT NULL DEFAULT '/assets/adivision1.png',
  featured BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft')),
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Indexes for High Performance Querying
CREATE INDEX IF NOT EXISTS idx_posts_slug ON public.posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_category ON public.posts(category);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- 4. Policy: Public Visitors Can Only View Published Posts
DROP POLICY IF EXISTS "Public can view published posts" ON public.posts;
CREATE POLICY "Public can view published posts"
ON public.posts
FOR SELECT
TO anon, authenticated
USING (status = 'published');

-- 5. Policy: Authenticated Admins / Writers have full CRUD access
DROP POLICY IF EXISTS "Authenticated writers full access" ON public.posts;
CREATE POLICY "Authenticated writers full access"
ON public.posts
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 6. Realtime Replication Enablement
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
