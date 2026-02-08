-- Migration: add `type` column to messages and backfill values
-- Run: npm --prefix server run migrate

BEGIN;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'public';
UPDATE messages
  SET type = CASE WHEN recipient IS NULL THEN 'public' ELSE 'private' END
  WHERE type IS NULL;
COMMIT;