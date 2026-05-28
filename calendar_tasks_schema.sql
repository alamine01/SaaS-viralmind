-- SQL Schema for Editorial Calendar Tasks
-- Copy and paste this script into your Supabase SQL Editor (https://supabase.com)

-- 1. Create the calendar_tasks table
CREATE TABLE IF NOT EXISTS calendar_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  platform TEXT CHECK (platform IN ('tiktok', 'youtube', 'instagram', 'other')) DEFAULT 'other',
  status TEXT NOT NULL DEFAULT 'ideas',  -- ideas | writing | filming | published
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  label_color TEXT DEFAULT '#6366f1',
  scheduled_date DATE,
  position INTEGER DEFAULT 0,           -- For sorting cards in a column
  collection_name TEXT DEFAULT 'General',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE calendar_tasks ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
DROP POLICY IF EXISTS "Users can manage their own calendar tasks" ON calendar_tasks;
CREATE POLICY "Users can manage their own calendar tasks" 
  ON calendar_tasks 
  FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Enable indexes for fast queries by user and collection
CREATE INDEX IF NOT EXISTS calendar_tasks_user_id_idx ON calendar_tasks(user_id);
CREATE INDEX IF NOT EXISTS calendar_tasks_collection_name_idx ON calendar_tasks(collection_name);
