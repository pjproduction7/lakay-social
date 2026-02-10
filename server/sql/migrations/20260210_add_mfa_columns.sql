-- Migration: Add MFA columns to users table
-- Date: 2026-02-10

ALTER TABLE users
ADD COLUMN IF NOT EXISTS mfa_secret TEXT,
ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT FALSE;