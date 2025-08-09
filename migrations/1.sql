
-- Core user profiles and firm data
CREATE TABLE user_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('Admin', 'Attorney', 'Staff', 'Client')),
  bar_number TEXT,
  practice_areas TEXT, -- JSON array
  phone TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Clients table
CREATE TABLE clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE,
  ssn_last4 TEXT,
  phones TEXT, -- JSON array
  email TEXT,
  address TEXT, -- JSON object
  emergency_contact TEXT, -- JSON object
  preferred_contact_method TEXT CHECK (preferred_contact_method IN ('Email', 'Phone', 'SMS')),
  notifications_opt_in BOOLEAN DEFAULT 1,
  portal_enabled BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Rate cards for billing
CREATE TABLE rate_cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  hourly_rates TEXT NOT NULL, -- JSON object {Attorney: 400, Staff: 150, Paralegal: 100}
  expense_markup_percent REAL DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Matters (cases)
CREATE TABLE matters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  matter_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  practice_area TEXT NOT NULL CHECK (practice_area IN ('Criminal', 'PersonalInjury', 'SSD')),
  status TEXT NOT NULL CHECK (status IN ('Intake', 'Open', 'Pending', 'Closed')),
  client_id INTEGER NOT NULL,
  assigned_attorney_ids TEXT, -- JSON array
  opened_at DATETIME,
  closed_at DATETIME,
  description TEXT,
  fee_model TEXT NOT NULL CHECK (fee_model IN ('FlatRate', 'Progressive')),
  flat_rate_amount REAL,
  rate_card_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Criminal cases
CREATE TABLE cases_criminal (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  matter_id INTEGER NOT NULL UNIQUE,
  charges TEXT, -- JSON array
  statutes TEXT, -- JSON array
  case_number TEXT,
  jurisdiction TEXT,
  arrest_date DATE,
  bond_terms TEXT,
  probation_terms TEXT,
  plea_offers TEXT, -- JSON array
  discovery_received_at DATETIME,
  evidence_items TEXT, -- JSON array
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Personal Injury cases
CREATE TABLE cases_pi (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  matter_id INTEGER NOT NULL UNIQUE,
  incident_date DATE,
  incident_type TEXT,
  injuries TEXT, -- JSON array
  providers TEXT, -- JSON array
  policy_limits REAL,
  demand_amount REAL,
  settlement_amount REAL,
  liens TEXT, -- JSON array
  med_bills_total REAL,
  lost_wages_total REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Social Security Disability cases
CREATE TABLE cases_ssd (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  matter_id INTEGER NOT NULL UNIQUE,
  ssa_claim_type TEXT CHECK (ssa_claim_type IN ('SSDI', 'SSI', 'Concurrent')),
  alleged_onset_date DATE,
  protective_filing_date DATE,
  representative_appointed BOOLEAN DEFAULT 0,
  rep_id TEXT,
  application_level TEXT CHECK (application_level IN ('Initial', 'Reconsideration', 'Hearing', 'AppealsCouncil', 'FederalCourt')),
  claims_numbers TEXT, -- JSON array
  field_office TEXT,
  odar_ohau_office TEXT,
  primary_impairments TEXT, -- JSON array
  vocational_profile TEXT, -- JSON object
  work_credits_years TEXT, -- JSON array
  sga_flags TEXT, -- JSON array
  medical_evidence_items TEXT, -- JSON array
  consultative_exam_appts TEXT, -- JSON array
  rfc_forms TEXT, -- JSON array
  treating_sources TEXT, -- JSON array
  representative_fee_cap_notice BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
