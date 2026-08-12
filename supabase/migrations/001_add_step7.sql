-- Add step7_complete column to topic_progress
-- Run in: Supabase Dashboard → SQL Editor
ALTER TABLE topic_progress ADD COLUMN IF NOT EXISTS step7_complete boolean NOT NULL DEFAULT false;
