-- Migration number: 0001 	 2025-06-28T19:14:05.311Z

-- SQLite doesn't support enum, so we use TEXT and CHECK constraint
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone_number TEXT,
  role TEXT CHECK (role IN ('admin', 'user')) DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE addresses (
  id TEXT PRIMARY KEY,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state_or_province TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  user_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 📊 INDEXES to optimize queries
-- Indexes for users table
CREATE INDEX idx_users_email ON users(email);           -- For authentication/search by email
CREATE INDEX idx_users_created_at ON users(created_at); -- For ordering by creation date

-- Indexes for addresses table
CREATE INDEX idx_addresses_user_id ON addresses(user_id);         -- For finding user's addresses
CREATE INDEX idx_addresses_is_default ON addresses(is_default);   -- For finding default addresses
CREATE INDEX idx_addresses_country ON addresses(country);         -- For filtering by country
CREATE INDEX idx_addresses_city ON addresses(city);               -- For filtering by city
CREATE INDEX idx_addresses_user_default ON addresses(user_id, is_default); -- Composite: user + default address


