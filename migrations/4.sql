
CREATE TABLE intakes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  matter_id INTEGER NOT NULL,
  intake_data TEXT NOT NULL, -- JSON object with all intake form data
  urgency_level TEXT CHECK (urgency_level IN ('Low', 'Medium', 'High', 'Urgent')),
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Reviewed', 'Approved', 'Rejected')),
  reviewed_by TEXT,
  reviewed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
