-- Migration: Add approved column and type to posts for memorial approval
-- Date: 2026-02-15

ALTER TABLE posts ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT TRUE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS post_type VARCHAR(20) DEFAULT 'post';
-- Set existing posts as approved and type 'post'
UPDATE posts SET approved = TRUE WHERE approved IS NULL;
UPDATE posts SET post_type = 'post' WHERE post_type IS NULL OR post_type = '';