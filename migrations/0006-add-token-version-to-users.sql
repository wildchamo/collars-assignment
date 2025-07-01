-- Migration number: 0006 	 2025-07-01T05:30:00.000Z

-- Add token_version column to users table for token invalidation
ALTER TABLE users ADD COLUMN token_version INTEGER DEFAULT 1 NOT NULL;

-- Create index for token version queries
CREATE INDEX idx_users_token_version ON users(id, token_version);
