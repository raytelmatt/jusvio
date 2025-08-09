
-- Time entries for billing
CREATE TABLE time_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  matter_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  entry_date DATE NOT NULL,
  hours REAL NOT NULL,
  rate REAL NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Invoices
CREATE TABLE invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  matter_id INTEGER NOT NULL,
  invoice_number TEXT NOT NULL UNIQUE,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  line_items TEXT, -- JSON array
  subtotal REAL NOT NULL,
  taxes REAL DEFAULT 0,
  discounts REAL DEFAULT 0,
  total REAL NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Draft', 'Sent', 'Paid', 'Overdue')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Payments
CREATE TABLE payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('Card', 'ACH', 'Cash', 'Check')),
  amount REAL NOT NULL,
  received_at DATETIME NOT NULL,
  reference TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tasks and todos
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  matter_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_at DATETIME,
  status TEXT NOT NULL CHECK (status IN ('Open', 'InProgress', 'Completed')),
  priority TEXT CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
  assignee_ids TEXT, -- JSON array
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Audit log for sensitive operations
CREATE TABLE audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id INTEGER NOT NULL,
  changes TEXT, -- JSON object of what changed
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
