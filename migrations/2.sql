
-- Courts and venues
CREATE TABLE courts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  jurisdiction TEXT,
  address TEXT, -- JSON object
  phone TEXT,
  clerk_email TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Hearings and court events
CREATE TABLE hearings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  matter_id INTEGER NOT NULL,
  court_id INTEGER,
  is_ssa_hearing BOOLEAN DEFAULT 0,
  hearing_type TEXT,
  start_at DATETIME,
  end_at DATETIME,
  courtroom TEXT,
  judge_or_alj TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Deadlines and important dates
CREATE TABLE deadlines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  matter_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  source TEXT CHECK (source IN ('Rule', 'CourtOrder', 'SSA', 'Manual')),
  trigger_event_id INTEGER,
  due_at DATETIME NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Open', 'Completed', 'PastDue')),
  responsible_user_ids TEXT, -- JSON array
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Document templates
CREATE TABLE document_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT,
  variables TEXT, -- JSON array
  body TEXT,
  output_type TEXT CHECK (output_type IN ('docx', 'pdf')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Generated documents
CREATE TABLE documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  matter_id INTEGER NOT NULL,
  template_id INTEGER,
  title TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  created_by TEXT NOT NULL,
  status TEXT CHECK (status IN ('Draft', 'Final')),
  file_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Communications log
CREATE TABLE communications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  matter_id INTEGER NOT NULL,
  channel TEXT CHECK (channel IN ('SMS', 'Email', 'Phone', 'Portal')),
  direction TEXT CHECK (direction IN ('Inbound', 'Outbound')),
  to_address TEXT,
  from_address TEXT,
  body TEXT,
  sent_at DATETIME,
  meta TEXT, -- JSON object for additional data
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
