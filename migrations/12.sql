
CREATE TABLE matter_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  matter_id INTEGER NOT NULL UNIQUE,
  calendar_reminders_enabled BOOLEAN DEFAULT 1,
  reminder_days_before TEXT,
  auto_deadline_creation BOOLEAN DEFAULT 1,
  notify_relevant_parties BOOLEAN DEFAULT 1,
  relevant_parties TEXT,
  hearing_buffer_days INTEGER DEFAULT 30,
  deadline_categories TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
