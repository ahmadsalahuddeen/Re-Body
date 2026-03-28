-- supabase/schema.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- Complete Supabase database setup for Project Body Rebirth.
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run
--
-- What this creates:
--   1. Tables: weight_logs, habit_logs, progress_images
--   2. Row Level Security on all tables (users only see their own data)
--   3. Indexes for common queries (user_id + date lookups)
--
-- ADDING A NEW MODULE:
--   The habit_logs table already has a module_id column (TEXT).
--   Just start logging with the new module_id — no schema changes needed.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── EXTENSIONS ───────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── TABLES ───────────────────────────────────────────────────────────────────

-- Weight Logs
-- Stores one entry per weigh-in. No limit on frequency.
CREATE TABLE IF NOT EXISTS weight_logs (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weight_kg   NUMERIC(5,2) NOT NULL CHECK (weight_kg > 0 AND weight_kg < 1000),
  logged_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habit Logs
-- One row per user per date per module. UNIQUE constraint prevents duplicates.
-- module_id is a plain TEXT — no foreign key needed, just matches lib/modules.ts IDs.
CREATE TABLE IF NOT EXISTS habit_logs (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date        DATE        NOT NULL DEFAULT CURRENT_DATE,
  module_id   TEXT        NOT NULL DEFAULT 'face',   -- e.g. 'face', 'comms', 'body'
  completed   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Prevent logging the same module twice on the same day
  UNIQUE (user_id, date, module_id)
);

-- Progress Images
-- Metadata only — actual images live in Supabase Storage bucket 'progress-images'.
-- storage_path is the path inside the bucket: "{user_id}/{timestamp}.jpg"
CREATE TABLE IF NOT EXISTS progress_images (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path    TEXT        NOT NULL,
  note            TEXT,
  is_worst_phase  BOOLEAN     NOT NULL DEFAULT FALSE,
  module_id       TEXT        NOT NULL DEFAULT 'face',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── INDEXES ───────────────────────────────────────────────────────────────────
-- These speed up the most common query pattern: WHERE user_id = ? ORDER BY date

CREATE INDEX IF NOT EXISTS idx_weight_logs_user_date
  ON weight_logs (user_id, logged_at DESC);

CREATE INDEX IF NOT EXISTS idx_habit_logs_user_date
  ON habit_logs (user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_progress_images_user_date
  ON progress_images (user_id, created_at DESC);

-- ── ROW LEVEL SECURITY ────────────────────────────────────────────────────────
-- This is the critical privacy layer.
-- With RLS enabled, even if someone has the anon key, they can ONLY read/write
-- rows where user_id matches auth.uid() (their own session).

ALTER TABLE weight_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_images ENABLE ROW LEVEL SECURITY;

-- Weight Logs policies
CREATE POLICY "weight_logs: users manage own rows"
  ON weight_logs
  FOR ALL
  USING       (auth.uid() = user_id)
  WITH CHECK  (auth.uid() = user_id);

-- Habit Logs policies
CREATE POLICY "habit_logs: users manage own rows"
  ON habit_logs
  FOR ALL
  USING       (auth.uid() = user_id)
  WITH CHECK  (auth.uid() = user_id);

-- Progress Images policies
CREATE POLICY "progress_images: users manage own rows"
  ON progress_images
  FOR ALL
  USING       (auth.uid() = user_id)
  WITH CHECK  (auth.uid() = user_id);

-- ── STORAGE SETUP INSTRUCTIONS ───────────────────────────────────────────────
-- Storage buckets can't be created via SQL — do this in the Dashboard:
--
-- 1. Go to: Supabase Dashboard → Storage → New bucket
-- 2. Name:  progress-images
-- 3. Public: NO (keep private — images only accessible via signed URLs)
-- 4. File size limit: 10MB (recommended)
-- 5. Allowed MIME types: image/jpeg, image/png, image/webp, image/heic
--
-- Then add these Storage RLS policies (Dashboard → Storage → Policies):
--
-- Policy name: "Users can upload to own folder"
-- Operation:   INSERT
-- Target roles: authenticated
-- Expression:  (auth.uid())::text = (storage.foldername(name))[1]
--
-- Policy name: "Users can read own files"
-- Operation:   SELECT
-- Target roles: authenticated
-- Expression:  (auth.uid())::text = (storage.foldername(name))[1]
--
-- Policy name: "Users can delete own files"
-- Operation:   DELETE
-- Target roles: authenticated
-- Expression:  (auth.uid())::text = (storage.foldername(name))[1]
