-- ============================================================
-- Mandarin Journey — Supabase schema
-- Paste this into: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- user_progress: one row per authenticated user
CREATE TABLE IF NOT EXISTS user_progress (
  user_id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  total_xp integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  streak_count integer NOT NULL DEFAULT 0,
  last_check_in date,
  completed_topics text[] NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- topic_progress: one row per (user, topic)
CREATE TABLE IF NOT EXISTS topic_progress (
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  topic_id text NOT NULL,
  step1_complete boolean NOT NULL DEFAULT false,
  step2_complete boolean NOT NULL DEFAULT false,
  step3_complete boolean NOT NULL DEFAULT false,
  step4_complete boolean NOT NULL DEFAULT false,
  step5_complete boolean NOT NULL DEFAULT false,
  step6_complete boolean NOT NULL DEFAULT false,
  step7_complete boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, topic_id)
);

-- item_progress: one row per (user, item, skill)
CREATE TABLE IF NOT EXISTS item_progress (
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  item_id text NOT NULL,
  skill_type text NOT NULL,
  last5_results text[] NOT NULL DEFAULT '{}',
  item_content_version_seen integer NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, item_id, skill_type)
);

-- ── Row Level Security ───────────────────────────────────────
ALTER TABLE user_progress  ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_progress  ENABLE ROW LEVEL SECURITY;

-- Each user can only read/write their own rows
CREATE POLICY "own_rows" ON user_progress
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own_rows" ON topic_progress
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own_rows" ON item_progress
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
