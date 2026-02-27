-- Migration: add must_change_password flag to users
-- Run: npm --prefix server run migrate

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE;
