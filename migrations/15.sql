
-- Criminal cases table
CREATE TABLE criminal_cases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  matter_id INTEGER NOT NULL,
  charges TEXT, -- JSON array
  statutes TEXT, -- JSON array
  case_number TEXT,
  jurisdiction TEXT,
  arrest_date DATE,
  bond_terms TEXT,
  probation_terms TEXT,
  plea_offers TEXT, -- JSON array
  discovery_received_at TIMESTAMP,
  evidence_items TEXT, -- JSON array
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Personal injury cases table
CREATE TABLE personal_injury_cases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  matter_id INTEGER NOT NULL,
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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SSD cases table
CREATE TABLE ssd_cases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  matter_id INTEGER NOT NULL,
  disability_onset_date DATE,
  last_work_date DATE,
  conditions TEXT, -- JSON array
  doctors TEXT, -- JSON array
  application_date DATE,
  denial_date DATE,
  appeal_deadline DATE,
  hearing_date DATE,
  decision_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
