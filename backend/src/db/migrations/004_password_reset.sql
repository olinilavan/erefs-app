-- Migration 004: password reset tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token UUID DEFAULT uuid_generate_v4() UNIQUE,
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '30 minutes',
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
