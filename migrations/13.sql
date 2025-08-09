
CREATE TABLE email_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sg_message_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  email TEXT NOT NULL,
  timestamp DATETIME NOT NULL,
  matter_id INTEGER,
  deadline_id INTEGER,
  hearing_id INTEGER,
  event_data TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE deadline_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deadline_id INTEGER NOT NULL,
  note TEXT NOT NULL,
  created_by_email TEXT,
  created_by_user_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_email_events_message_id ON email_events(sg_message_id);
CREATE INDEX idx_deadline_notes_deadline_id ON deadline_notes(deadline_id);
