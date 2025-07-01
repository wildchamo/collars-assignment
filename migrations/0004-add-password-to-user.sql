-- Migration number: 0004 	 2025-06-30T19:14:48.905Z

-- Add password column to users table
ALTER TABLE users ADD COLUMN password TEXT NOT NULL DEFAULT 'default_password';

-- Insert default admin user
INSERT INTO users (name, email, phone_number, password, role)
VALUES ('Admin User', 'admin@example.com', '+1234567890', 'password', 'admin');