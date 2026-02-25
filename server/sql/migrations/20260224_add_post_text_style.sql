-- Migration: add text style columns to posts
-- Run: npm --prefix server run migrate

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS text_color VARCHAR(32),
  ADD COLUMN IF NOT EXISTS font_family VARCHAR(80);
