import z from "zod";

// User Profile Schema
export const UserProfileSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  role: z.enum(['Admin', 'Attorney', 'Staff', 'Client']),
  bar_number: z.string().nullable(),
  practice_areas: z.string().nullable(), // JSON array
  phone: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

// Client Schema
export const ClientSchema = z.object({
  id: z.number(),
  client_number: z.string().nullable(),
  first_name: z.string(),
  last_name: z.string(),
  date_of_birth: z.string().nullable(),
  ssn_last4: z.string().nullable(),
  phones: z.string().nullable(), // JSON array
  email: z.string().nullable(),
  address: z.string().nullable(), // JSON object
  emergency_contact: z.string().nullable(), // JSON object
  preferred_contact_method: z.enum(['Email', 'Phone', 'SMS']).nullable(),
  notifications_opt_in: z.boolean(),
  portal_enabled: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Client = z.infer<typeof ClientSchema>;

// Matter Schema
export const MatterSchema = z.object({
  id: z.number(),
  matter_number: z.string(),
  title: z.string(),
  practice_area: z.enum(['Criminal', 'PersonalInjury', 'SSD']),
  status: z.enum(['Intake', 'Open', 'Pending', 'Closed']),
  client_id: z.number(),
  assigned_attorney_ids: z.string().nullable(), // JSON array
  opened_at: z.string().nullable(),
  closed_at: z.string().nullable(),
  description: z.string().nullable(),
  fee_model: z.enum(['FlatRate', 'Progressive']),
  flat_rate_amount: z.number().nullable(),
  rate_card_id: z.number().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  // Client info (populated from joins)
  client_first_name: z.string().optional(),
  client_last_name: z.string().optional(),
  client_email: z.string().optional(),
});

export type Matter = z.infer<typeof MatterSchema>;

// Criminal Case Schema
export const CriminalCaseSchema = z.object({
  id: z.number(),
  matter_id: z.number(),
  charges: z.string().nullable(), // JSON array
  statutes: z.string().nullable(), // JSON array
  case_number: z.string().nullable(),
  jurisdiction: z.string().nullable(),
  arrest_date: z.string().nullable(),
  bond_terms: z.string().nullable(),
  probation_terms: z.string().nullable(),
  plea_offers: z.string().nullable(), // JSON array
  discovery_received_at: z.string().nullable(),
  evidence_items: z.string().nullable(), // JSON array
  created_at: z.string(),
  updated_at: z.string(),
});

export type CriminalCase = z.infer<typeof CriminalCaseSchema>;

// Hearing Schema
export const HearingSchema = z.object({
  id: z.number(),
  matter_id: z.number(),
  court_id: z.number().nullable(),
  is_ssa_hearing: z.boolean(),
  hearing_type: z.string().nullable(),
  start_at: z.string().nullable(),
  end_at: z.string().nullable(),
  courtroom: z.string().nullable(),
  judge_or_alj: z.string().nullable(),
  notes: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Hearing = z.infer<typeof HearingSchema>;

// Invoice Schema
export const InvoiceSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(val => typeof val === 'string' ? val : val.toString()),
  matter_id: z.union([z.string(), z.number()]).transform(val => typeof val === 'string' ? parseInt(val) : val),
  invoice_number: z.string(),
  description: z.string().optional(),
  issue_date: z.string(),
  due_date: z.string(),
  line_items: z.string().optional(), // JSON array
  subtotal: z.union([z.string(), z.number()]).transform(val => typeof val === 'string' ? parseFloat(val) : val),
  taxes: z.union([z.string(), z.number()]).transform(val => typeof val === 'string' ? parseFloat(val) : val).default(0),
  discounts: z.union([z.string(), z.number()]).transform(val => typeof val === 'string' ? parseFloat(val) : val).default(0),
  total: z.union([z.string(), z.number()]).transform(val => typeof val === 'string' ? parseFloat(val) : val),
  status: z.enum(['Draft', 'Sent', 'Paid', 'Overdue']),
  created_at: z.string(),
  updated_at: z.string(),
  created_by: z.string().optional(),
});

export type Invoice = z.infer<typeof InvoiceSchema>;

// Payment Schema
export const PaymentSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(val => typeof val === 'string' ? val : val.toString()),
  matter_id: z.union([z.string(), z.number()]).transform(val => typeof val === 'string' ? parseInt(val) : val),
  invoice_id: z.union([z.string(), z.number()]).transform(val => typeof val === 'string' ? val : val.toString()).optional(),
  amount: z.union([z.string(), z.number()]).transform(val => typeof val === 'string' ? parseFloat(val) : val),
  method: z.enum(['Cash', 'Check', 'Credit Card', 'Bank Transfer', 'Other']),
  reference: z.string().optional(),
  received_date: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  created_by: z.string(),
});

export type Payment = z.infer<typeof PaymentSchema>;

// Deadline Schema
export const DeadlineSchema = z.object({
  id: z.number(),
  matter_id: z.number(),
  title: z.string(),
  source: z.enum(['Rule', 'CourtOrder', 'SSA', 'Manual']),
  trigger_event_id: z.number().nullable(),
  due_at: z.string(),
  status: z.enum(['Open', 'Completed', 'PastDue']),
  responsible_user_ids: z.string().nullable(), // JSON array
  created_at: z.string(),
  updated_at: z.string(),
});

export type Deadline = z.infer<typeof DeadlineSchema>;

// Create Matter Request Schema
export const CreateMatterSchema = z.object({
  client_id: z.number(),
  title: z.string().min(1),
  practice_area: z.enum(['Criminal', 'PersonalInjury', 'SSD']),
  description: z.string().optional(),
  fee_model: z.enum(['FlatRate', 'Progressive']),
  flat_rate_amount: z.number().optional(),
});

export type CreateMatterRequest = z.infer<typeof CreateMatterSchema>;

// Create Client Request Schema
export const CreateClientSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  preferred_contact_method: z.enum(['Email', 'Phone', 'SMS']).optional(),
});

export type CreateClientRequest = z.infer<typeof CreateClientSchema>;

// Dashboard Stats Schema
export const DashboardStatsSchema = z.object({
  open_matters_by_practice: z.object({
    Criminal: z.number(),
    PersonalInjury: z.number(),
    SSD: z.number(),
  }),
  upcoming_hearings: z.number(),
  deadlines_7_days: z.number(),
  deadlines_30_days: z.number(),
  unpaid_invoices: z.number(),
  new_portal_messages: z.number(),
});

export type DashboardStats = z.infer<typeof DashboardStatsSchema>;

// Document Schema
export const DocumentSchema = z.object({
  id: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? val : String(val)),
  $id: z.string().optional(),
  matter_id: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseInt(val) : val),
  template_id: z.union([z.number(), z.string()]).nullable().optional().transform(val => val ? (typeof val === 'string' ? parseInt(val) : val) : null),
  title: z.string(),
  version: z.number(),
  created_by: z.string(),
  status: z.enum(['Draft', 'Final']),
  file_url: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  $createdAt: z.string().optional(),
  $updatedAt: z.string().optional(),
  matter_title: z.string().optional(),
  client_name: z.string().optional(),
});

export type Document = z.infer<typeof DocumentSchema>;

// Document Version Schema
export const DocumentVersionSchema = z.object({
  id: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? val : String(val)),
  $id: z.string().optional(),
  document_id: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseInt(val) : val),
  version: z.number(),
  created_by: z.string(),
  created_at: z.string(),
  $createdAt: z.string().optional(),
  changes_summary: z.string().nullable().optional(),
  file_url: z.string().nullable().optional(),
});

export type DocumentVersion = z.infer<typeof DocumentVersionSchema>;

// Time Entry Schema
export const TimeEntrySchema = z.object({
  id: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? val : String(val)),
  $id: z.string().optional(),
  matter_id: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseInt(val) : val),
  description: z.string(),
  hours: z.number(),
  rate: z.number(),
  entry_date: z.string(),
  created_by: z.string(),
  created_at: z.string(),
  $createdAt: z.string().optional(),
});

export type TimeEntry = z.infer<typeof TimeEntrySchema>;

// Communication Schema
export const CommunicationSchema = z.object({
  id: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? val : String(val)),
  $id: z.string().optional(),
  matter_id: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseInt(val) : val),
  type: z.string(),
  direction: z.string(),
  subject: z.string().optional(),
  body: z.string(),
  created_at: z.string(),
  $createdAt: z.string().optional(),
  // Additional email properties
  channel: z.string().optional(),
  from_address: z.string().optional(),
  to_address: z.string().optional(),
  sent_at: z.string().optional(),
});

export type Communication = z.infer<typeof CommunicationSchema>;

// Task Schema
export const TaskSchema = z.object({
  id: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? val : String(val)),
  $id: z.string().optional(),
  matter_id: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseInt(val) : val),
  title: z.string(),
  description: z.string().optional(),
  status: z.enum(['Open', 'InProgress', 'Completed']),
  due_at: z.string().optional(),
  assigned_to_user_ids: z.string().optional(),
  created_at: z.string(),
  $createdAt: z.string().optional(),
  // Computed field for UI
  days_until_due: z.number().optional(),
});

export type Task = z.infer<typeof TaskSchema>;

// Backend Document Response Type (legacy-compatible)
export interface LegacyDocument {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  [key: string]: unknown;
}
