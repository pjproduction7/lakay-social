-- Migration: Add message editing fields
-- Date: 2026-02-10

-- Add columns for message editing
ALTER TABLE messages
    ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS original_content TEXT,
    ADD COLUMN IF NOT EXISTS edit_count INTEGER DEFAULT 0;

-- Create a table to store message edit history for admin archives
CREATE TABLE IF NOT EXISTS message_edits (
    id SERIAL PRIMARY KEY,
    message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    previous_content TEXT NOT NULL,
    edited_by VARCHAR(32) NOT NULL,
    edited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_edits_message_id ON message_edits(message_id);
CREATE INDEX IF NOT EXISTS idx_message_edits_edited_at ON message_edits(edited_at);