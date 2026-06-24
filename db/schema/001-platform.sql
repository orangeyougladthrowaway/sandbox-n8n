-- Platform schema for sandbox-n8n POC
CREATE TABLE IF NOT EXISTS complaint_records (
  id TEXT PRIMARY KEY,
  external_ref TEXT,
  channel TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL,
  raw_artifact_path TEXT,
  normalized_text TEXT,
  attachments JSONB DEFAULT '[]',
  classification JSONB DEFAULT '{}',
  requested_actions JSONB DEFAULT '[]',
  sentiment JSONB DEFAULT '{}',
  crm_ref TEXT,
  ticket_ref TEXT,
  thread_id TEXT,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS complaint_events (
  id SERIAL PRIMARY KEY,
  complaint_id TEXT NOT NULL REFERENCES complaint_records(id),
  event_type TEXT NOT NULL,
  detail JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS check_runs (
  id TEXT PRIMARY KEY,
  query_name TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'running'
);

CREATE TABLE IF NOT EXISTS check_exceptions (
  id SERIAL PRIMARY KEY,
  check_run_id TEXT REFERENCES check_runs(id),
  query_name TEXT,
  row_data JSONB,
  severity TEXT,
  owner_team TEXT,
  ticket_ref TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ops_tasks (
  id TEXT PRIMARY KEY,
  query_name TEXT,
  title TEXT,
  owner_team TEXT,
  priority TEXT,
  status TEXT DEFAULT 'open',
  dedupe_key TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ops_events (
  id SERIAL PRIMARY KEY,
  ops_task_id TEXT REFERENCES ops_tasks(id),
  event_type TEXT,
  detail JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  channel TEXT,
  recipient TEXT,
  subject TEXT,
  body TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_complaint_events_complaint_id ON complaint_events(complaint_id);
CREATE INDEX IF NOT EXISTS idx_complaint_records_thread_id ON complaint_records(thread_id);
