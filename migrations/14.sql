
CREATE TABLE email_reminders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deadline_id INTEGER NOT NULL,
  reminder_days INTEGER NOT NULL,
  sent_at DATETIME NOT NULL,
  message_ids TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE hearing_reminders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hearing_id INTEGER NOT NULL,
  reminder_days INTEGER NOT NULL,
  sent_at DATETIME NOT NULL,
  message_ids TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_email_reminders_deadline ON email_reminders(deadline_id, reminder_days);
CREATE INDEX idx_hearing_reminders_hearing ON hearing_reminders(hearing_id, reminder_days);
