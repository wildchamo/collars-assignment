-- Migration number: 0007 	 2025-07-01T05:31:00.000Z
-- OPTIONAL: Token blacklist table (alternative to token versioning)

CREATE TABLE token_blacklist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT NOT NULL UNIQUE,
  invalidated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient blacklist queries
CREATE INDEX idx_token_blacklist_token ON token_blacklist(token);
CREATE INDEX idx_token_blacklist_expires ON token_blacklist(expires_at);

-- Trigger to automatically clean expired tokens (optional optimization)
-- Note: This would need to be run periodically, not on every request
