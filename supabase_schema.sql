-- Create tables for ViralMind SaaS

-- 1. Profiles table (linked to auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  plan TEXT DEFAULT 'free',
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Videos table
CREATE TABLE videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL CHECK (platform IN ('tiktok', 'youtube', 'instagram')),
  title TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  thumbnail TEXT,
  views BIGINT DEFAULT 0,
  likes BIGINT DEFAULT 0,
  comments BIGINT DEFAULT 0,
  duration INTEGER, -- in seconds
  hashtags TEXT[],
  niche TEXT NOT NULL,
  transcript TEXT,
  hook TEXT,
  structure JSONB,
  viral_score FLOAT DEFAULT 0,
  patterns TEXT[],
  followers BIGINT DEFAULT 0,
  outlier_score FLOAT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Saved Items table
CREATE TABLE saved_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  content TEXT, -- for saved scripts
  type TEXT NOT NULL CHECK (type IN ('video', 'script')),
  collection_name TEXT DEFAULT 'Default',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Voice Profiles table
CREATE TABLE voice_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  analysis JSONB, -- Gemini analysis of the style
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public videos are viewable by everyone" ON videos FOR SELECT USING (true);
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view their own saved items" ON saved_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own saved items" ON saved_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own saved items" ON saved_items FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own voice profiles" ON voice_profiles FOR ALL USING (auth.uid() = user_id);

-- 5. Monitored Accounts table
CREATE TABLE monitored_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  handle TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('tiktok', 'instagram', 'youtube')),
  last_scanned_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. Detected Outliers table
CREATE TABLE detected_outliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES monitored_accounts(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  thumbnail TEXT,
  views BIGINT DEFAULT 0,
  followers_at_time BIGINT DEFAULT 0,
  outlier_score FLOAT DEFAULT 0,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE monitored_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE detected_outliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own monitored accounts" ON monitored_accounts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own detected outliers" ON detected_outliers FOR ALL USING (auth.uid() = user_id);
