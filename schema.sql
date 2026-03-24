CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE UNIQUE NOT NULL,
  top_stories JSONB NOT NULL,
  analysis TEXT NOT NULL,
  personal_implications TEXT NOT NULL,
  raw_sources JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
