CREATE TABLE IF NOT EXISTS chat_sessions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_token  VARCHAR(64) UNIQUE NOT NULL,
  page_url       VARCHAR(500),
  created_at     TIMESTAMP DEFAULT NOW(),
  last_active_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role       VARCHAR(15) NOT NULL CHECK (role IN ('user', 'assistant')),
  content    TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS chat_messages_session_idx ON chat_messages(session_id, created_at);
CREATE INDEX IF NOT EXISTS chat_sessions_active_idx  ON chat_sessions(last_active_at DESC);
