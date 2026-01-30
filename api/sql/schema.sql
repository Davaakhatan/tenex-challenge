CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  filename text NOT NULL,
  storage_path text NOT NULL,
  size_bytes integer NOT NULL,
  status text NOT NULL DEFAULT 'parsed',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id uuid NOT NULL REFERENCES uploads(id) ON DELETE CASCADE,
  ts timestamptz NOT NULL,
  src_ip text NOT NULL,
  dest_host text NOT NULL,
  method text NOT NULL,
  path text NOT NULL,
  status integer NOT NULL,
  bytes integer NOT NULL,
  raw text NOT NULL
);

CREATE INDEX IF NOT EXISTS events_upload_id_idx ON events(upload_id);

CREATE TABLE IF NOT EXISTS anomalies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id uuid NOT NULL REFERENCES uploads(id) ON DELETE CASCADE,
  event_id uuid REFERENCES events(id),
  rule text NOT NULL,
  explanation text NOT NULL,
  confidence numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS anomalies_upload_id_idx ON anomalies(upload_id);
