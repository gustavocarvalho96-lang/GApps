CREATE TABLE IF NOT EXISTS pendencias_sessions (
  session_key TEXT PRIMARY KEY NOT NULL,
  tasks_json TEXT NOT NULL DEFAULT '[]',
  revision INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

INSERT OR IGNORE INTO pendencias_sessions (session_key, tasks_json, revision, updated_at)
VALUES
  ('1', '[]', 0, 0), ('2', '[]', 0, 0), ('3', '[]', 0, 0),
  ('4', '[]', 0, 0), ('5', '[]', 0, 0), ('6', '[]', 0, 0),
  ('7', '[]', 0, 0), ('8', '[]', 0, 0), ('9', '[]', 0, 0);
