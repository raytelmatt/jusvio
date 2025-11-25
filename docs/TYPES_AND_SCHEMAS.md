# Jusivo Case Manager - Types and Schemas Documentation

## Overview

This document provides comprehensive documentation for all TypeScript types, Zod schemas, and data models used in the Jusivo Case Manager application.

## Table of Contents

1. [Core Entity Types](#core-entity-types)
2. [Request/Response Types](#requestresponse-types)
3. [Backend Service Types](#backend-service-types)
4. [Component Props Types](#component-props-types)
5. [Utility Types](#utility-types)
6. [Zod Schemas](#zod-schemas)
7. [Type Guards](#type-guards)
8. [Type Utilities](#type-utilities)

## Core Entity Types

### UserProfile

Represents a user profile in the system.

```typescript
interface UserProfile {
  id: number;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  role: 'Admin' | 'Attorney' | 'Staff' | 'Client';
  bar_number: string | null;
  practice_areas: string | null; // JSON array
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

**Fields:**
- `id`: Unique numeric identifier
- `user_id`: Firebase user ID
- `first_name`: User's first name
- `last_name`: User's last name
- `role`: User role in the system
- `bar_number`: Attorney bar number (if applicable)
- `practice_areas`: JSON array of practice areas
- `phone`: Contact phone number
- `is_active`: Whether the user account is active
- `created_at`: ISO timestamp of creation
- `updated_at`: ISO timestamp of last update

### Client

Represents a client in the system.

```typescript
interface Client {
  id: number;
  client_number: string | null;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  ssn_last4: string | null;
  phones: string | null; // JSON array
  email: string | null;
  address: string | null; // JSON object
  emergency_contact: string | null; // JSON object
  preferred_contact_method: 'Email' | 'Phone' | 'SMS' | null;
  notifications_opt_in: boolean;
  portal_enabled: boolean;
  created_at: string;
  updated_at: string;
}
```

**Fields:**
- `id`: Unique numeric identifier
- `client_number`: Human-readable client number
- `first_name`: Client's first name
- `last_name`: Client's last name
- `date_of_birth`: ISO date string
- `ssn_last4`: Last 4 digits of SSN
- `phones`: JSON array of phone numbers
- `email`: Primary email address
- `address`: JSON object with address fields
- `emergency_contact`: JSON object with emergency contact info
- `preferred_contact_method`: Preferred communication method
- `notifications_opt_in`: Whether client wants notifications
- `portal_enabled`: Whether client portal is enabled
- `created_at`: ISO timestamp of creation
- `updated_at`: ISO timestamp of last update

### Matter

Represents a legal matter/case in the system.

```typescript
interface Matter {
  id: number;
  matter_number: string;
  title: string;
  practice_area: 'Criminal' | 'PersonalInjury' | 'SSD';
  status: 'Intake' | 'Open' | 'Pending' | 'Closed';
  client_id: number;
  assigned_attorney_ids: string | null; // JSON array
  opened_at: string | null;
  closed_at: string | null;
  description: string | null;
  fee_model: 'FlatRate' | 'Progressive';
  flat_rate_amount: number | null;
  rate_card_id: number | null;
  created_at: string;
  updated_at: string;
  // Client info (populated from joins)
  client_first_name?: string;
  client_last_name?: string;
  client_email?: string;
}
```

**Fields:**
- `id`: Unique numeric identifier
- `matter_number`: Human-readable matter number
- `title`: Matter title/name
- `practice_area`: Type of legal practice
- `status`: Current matter status
- `client_id`: Reference to client
- `assigned_attorney_ids`: JSON array of attorney user IDs
- `opened_at`: ISO timestamp when matter was opened
- `closed_at`: ISO timestamp when matter was closed
- `description`: Matter description
- `fee_model`: Billing model type
- `flat_rate_amount`: Fixed fee amount (if applicable)
- `rate_card_id`: Reference to rate card
- `created_at`: ISO timestamp of creation
- `updated_at`: ISO timestamp of last update
- `client_first_name`: Populated from client join
- `client_last_name`: Populated from client join
- `client_email`: Populated from client join

### CriminalCase

Represents criminal case-specific information.

```typescript
interface CriminalCase {
  id: number;
  matter_id: number;
  charges: string | null; // JSON array
  statutes: string | null; // JSON array
  case_number: string | null;
  jurisdiction: string | null;
  arrest_date: string | null;
  bond_terms: string | null;
  probation_terms: string | null;
  plea_offers: string | null; // JSON array
  discovery_received_at: string | null;
  evidence_items: string | null; // JSON array
  created_at: string;
  updated_at: string;
}
```

**Fields:**
- `id`: Unique numeric identifier
- `matter_id`: Reference to parent matter
- `charges`: JSON array of criminal charges
- `statutes`: JSON array of applicable statutes
- `case_number`: Court case number
- `jurisdiction`: Court jurisdiction
- `arrest_date`: ISO date of arrest
- `bond_terms`: Bond conditions
- `probation_terms`: Probation conditions
- `plea_offers`: JSON array of plea offers
- `discovery_received_at`: ISO timestamp of discovery receipt
- `evidence_items`: JSON array of evidence items
- `created_at`: ISO timestamp of creation
- `updated_at`: ISO timestamp of last update

### Hearing

Represents a court hearing or SSA hearing.

```typescript
interface Hearing {
  id: number;
  matter_id: number;
  court_id: number | null;
  is_ssa_hearing: boolean;
  hearing_type: string | null;
  start_at: string | null;
  end_at: string | null;
  courtroom: string | null;
  judge_or_alj: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
```

**Fields:**
- `id`: Unique numeric identifier
- `matter_id`: Reference to parent matter
- `court_id`: Reference to court
- `is_ssa_hearing`: Whether this is an SSA hearing
- `hearing_type`: Type of hearing
- `start_at`: ISO timestamp of hearing start
- `end_at`: ISO timestamp of hearing end
- `courtroom`: Courtroom identifier
- `judge_or_alj`: Judge or ALJ name
- `notes`: Additional hearing notes
- `created_at`: ISO timestamp of creation
- `updated_at`: ISO timestamp of last update

### Document

Represents a document in the system.

```typescript
interface Document {
  id: string;
  $id?: string;
  matter_id: number;
  template_id: number | null;
  title: string;
  version: number;
  created_by: string;
  status: 'Draft' | 'Final';
  file_url: string | null;
  created_at: string;
  updated_at: string;
  $createdAt?: string;
  $updatedAt?: string;
  matter_title?: string;
  client_name?: string;
}
```

**Fields:**
- `id`: Unique string identifier
- `$id`: Firebase document ID
- `matter_id`: Reference to parent matter
- `template_id`: Reference to document template
- `title`: Document title
- `version`: Document version number
- `created_by`: User ID of creator
- `status`: Document status
- `file_url`: URL to document file
- `created_at`: ISO timestamp of creation
- `updated_at`: ISO timestamp of last update
- `$createdAt`: Firebase creation timestamp
- `$updatedAt`: Firebase update timestamp
- `matter_title`: Populated from matter join
- `client_name`: Populated from client join

### DocumentVersion

Represents a version of a document.

```typescript
interface DocumentVersion {
  id: string;
  $id?: string;
  document_id: number;
  version: number;
  created_by: string;
  created_at: string;
  $createdAt?: string;
  changes_summary: string | null;
  file_url: string | null;
}
```

**Fields:**
- `id`: Unique string identifier
- `$id`: Firebase document ID
- `document_id`: Reference to parent document
- `version`: Version number
- `created_by`: User ID of creator
- `created_at`: ISO timestamp of creation
- `$createdAt`: Firebase creation timestamp
- `changes_summary`: Summary of changes in this version
- `file_url`: URL to version file

### Invoice

Represents an invoice in the system.

```typescript
interface Invoice {
  id: string;
  matter_id: number;
  invoice_number: string;
  description?: string;
  amount: number;
  total: number;
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue';
  due_date: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}
```

**Fields:**
- `id`: Unique string identifier
- `matter_id`: Reference to parent matter
- `invoice_number`: Human-readable invoice number
- `description`: Invoice description
- `amount`: Invoice amount
- `total`: Total amount including taxes/fees
- `status`: Invoice status
- `due_date`: ISO date when payment is due
- `created_at`: ISO timestamp of creation
- `updated_at`: ISO timestamp of last update
- `created_by`: User ID of creator

### Payment

Represents a payment in the system.

```typescript
interface Payment {
  id: string;
  matter_id: number;
  invoice_id?: string;
  amount: number;
  method: 'Cash' | 'Check' | 'Credit Card' | 'Bank Transfer' | 'Other';
  reference?: string;
  received_date: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}
```

**Fields:**
- `id`: Unique string identifier
- `matter_id`: Reference to parent matter
- `invoice_id`: Reference to paid invoice
- `amount`: Payment amount
- `method`: Payment method
- `reference`: Payment reference number
- `received_date`: ISO date when payment was received
- `created_at`: ISO timestamp of creation
- `updated_at`: ISO timestamp of last update
- `created_by`: User ID of creator

### TimeEntry

Represents a time entry for billing purposes.

```typescript
interface TimeEntry {
  id: string;
  $id?: string;
  matter_id: number;
  description: string;
  hours: number;
  rate: number;
  entry_date: string;
  created_by: string;
  created_at: string;
  $createdAt?: string;
}
```

**Fields:**
- `id`: Unique string identifier
- `$id`: Firebase document ID
- `matter_id`: Reference to parent matter
- `description`: Description of work performed
- `hours`: Number of hours worked
- `rate`: Hourly rate
- `entry_date`: ISO date of work performed
- `created_by`: User ID of creator
- `created_at`: ISO timestamp of creation
- `$createdAt`: Firebase creation timestamp

### Task

Represents a task in the system.

```typescript
interface Task {
  id: string;
  $id?: string;
  matter_id: number;
  title: string;
  description?: string;
  status: 'Open' | 'InProgress' | 'Completed';
  due_at?: string;
  assigned_to_user_ids?: string;
  created_at: string;
  $createdAt?: string;
  days_until_due?: number;
}
```

**Fields:**
- `id`: Unique string identifier
- `$id`: Firebase document ID
- `matter_id`: Reference to parent matter
- `title`: Task title
- `description`: Task description
- `status`: Task status
- `due_at`: ISO date when task is due
- `assigned_to_user_ids`: JSON array of assigned user IDs
- `created_at`: ISO timestamp of creation
- `$createdAt`: Firebase creation timestamp
- `days_until_due`: Computed field for UI

### Communication

Represents a communication record.

```typescript
interface Communication {
  id: string;
  $id?: string;
  matter_id: number;
  type: string;
  direction: string;
  subject?: string;
  body: string;
  created_at: string;
  $createdAt?: string;
  channel?: string;
  from_address?: string;
  to_address?: string;
  sent_at?: string;
}
```

**Fields:**
- `id`: Unique string identifier
- `$id`: Firebase document ID
- `matter_id`: Reference to parent matter
- `type`: Communication type
- `direction`: Inbound or outbound
- `subject`: Communication subject
- `body`: Communication content
- `created_at`: ISO timestamp of creation
- `$createdAt`: Firebase creation timestamp
- `channel`: Communication channel (email, phone, etc.)
- `from_address`: Sender address
- `to_address`: Recipient address
- `sent_at`: ISO timestamp when sent

### Deadline

Represents a deadline in the system.

```typescript
interface Deadline {
  id: number;
  matter_id: number;
  title: string;
  source: 'Rule' | 'CourtOrder' | 'SSA' | 'Manual';
  trigger_event_id: number | null;
  due_at: string;
  status: 'Open' | 'Completed' | 'PastDue';
  responsible_user_ids: string | null; // JSON array
  created_at: string;
  updated_at: string;
}
```

**Fields:**
- `id`: Unique numeric identifier
- `matter_id`: Reference to parent matter
- `title`: Deadline title
- `source`: Source of the deadline
- `trigger_event_id`: Reference to triggering event
- `due_at`: ISO timestamp when deadline is due
- `status`: Deadline status
- `responsible_user_ids`: JSON array of responsible user IDs
- `created_at`: ISO timestamp of creation
- `updated_at`: ISO timestamp of last update

## Request/Response Types

### CreateMatterRequest

Request type for creating a new matter.

```typescript
interface CreateMatterRequest {
  client_id: number;
  title: string;
  practice_area: 'Criminal' | 'PersonalInjury' | 'SSD';
  description?: string;
  fee_model: 'FlatRate' | 'Progressive';
  flat_rate_amount?: number;
}
```

### CreateClientRequest

Request type for creating a new client.

```typescript
interface CreateClientRequest {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  preferred_contact_method?: 'Email' | 'Phone' | 'SMS';
}
```

### DashboardStats

Response type for dashboard statistics.

```typescript
interface DashboardStats {
  open_matters_by_practice: {
    Criminal: number;
    PersonalInjury: number;
    SSD: number;
  };
  upcoming_hearings: number;
  deadlines_7_days: number;
  deadlines_30_days: number;
  unpaid_invoices: number;
  new_portal_messages: number;
}
```

### ClientBalance

Response type for client balance information.

```typescript
interface ClientBalance {
  id: string;
  client_id: string;
  client_number?: string;
  first_name: string;
  last_name: string;
  email?: string;
  balance: number;
  current_balance: number;
  total_paid: number;
  total_invoiced: number;
  unbilled_amount: number;
  total_amount_due: number;
  last_payment_date?: string;
  outstanding_invoices: number;
  matter_balances?: Array<{
    matter_id: string;
    matter_number: string;
    matter_title: string;
    balance: number;
  }>;
  recent_invoices?: Array<{
    id: string;
    invoice_number: string;
    status: string;
    matter_title: string;
    issue_date: string;
    due_date: string;
    total: number;
  }>;
  recent_payments?: Array<{
    id: string;
    invoice_number: string;
    matter_title: string;
    received_at: string;
    payment_method: string;
    reference?: string;
    amount: number;
  }>;
}
```

## Backend Service Types

### BackendUser

Represents a user in the backend system.

```typescript
interface BackendUser {
  $id: string;
  email: string;
  name?: string;
  prefs?: Record<string, unknown>;
}
```

### BackendDocument

Represents a document in the backend system.

```typescript
interface BackendDocument {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  [key: string]: unknown;
}
```

### BackendFile

Represents a file in the backend storage system.

```typescript
interface BackendFile {
  $id: string;
  name: string;
  mimeType: string;
  sizeOriginal: number;
  $createdAt: string;
}
```

### BackendListResponse

Response type for list operations.

```typescript
interface BackendListResponse<T> {
  total: number;
  documents: T[];
}
```

### BackendQuery

Query builder interface.

```typescript
interface BackendQuery {
  equal(attribute: string, value: unknown): BackendQuery;
  notEqual(attribute: string, value: unknown): BackendQuery;
  lessThan(attribute: string, value: unknown): BackendQuery;
  greaterThan(attribute: string, value: unknown): BackendQuery;
  search(attribute: string, value: string): BackendQuery;
  orderAsc(attribute: string): BackendQuery;
  orderDesc(attribute: string): BackendQuery;
  limit(limit: number): BackendQuery;
  offset(offset: number): BackendQuery;
}
```

### BackendAuthService

Authentication service interface.

```typescript
interface BackendAuthService {
  getCurrentUser(): Promise<BackendUser | null>;
  get(): Promise<BackendUser | null>;
  loginWithGoogle(successUrl: string, failureUrl: string): Promise<void>;
  loginWithEmailPassword(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
  createJWT(): Promise<{ jwt: string }>;
}
```

### BackendDatabaseService

Database service interface.

```typescript
interface BackendDatabaseService {
  listDocuments<T = BackendDocument>(
    databaseId: string,
    collectionId: string,
    queries?: string[]
  ): Promise<BackendListResponse<T>>;
  
  getDocument<T = BackendDocument>(
    databaseId: string,
    collectionId: string,
    documentId: string
  ): Promise<T>;
  
  createDocument<T = BackendDocument>(
    databaseId: string,
    collectionId: string,
    documentId: string,
    data: Partial<T>,
    permissions?: string[]
  ): Promise<T>;
  
  updateDocument<T = BackendDocument>(
    databaseId: string,
    collectionId: string,
    documentId: string,
    data: Partial<T>,
    permissions?: string[]
  ): Promise<T>;
  
  deleteDocument(
    databaseId: string,
    collectionId: string,
    documentId: string
  ): Promise<void>;
}
```

### BackendStorageService

Storage service interface.

```typescript
interface BackendStorageService {
  createFile(
    bucketId: string,
    fileId: string,
    file: File
  ): Promise<BackendFile>;
  
  getFile(bucketId: string, fileId: string): Promise<BackendFile>;
  
  deleteFile(bucketId: string, fileId: string): Promise<void>;
  
  getFilePreview(
    bucketId: string,
    fileId: string,
    width?: number,
    height?: number
  ): string;
  
  getFileView(bucketId: string, fileId: string): string;
  
  getFileDownload(bucketId: string, fileId: string): string;
}
```

### BackendService

Main backend service interface.

```typescript
interface BackendService {
  auth: BackendAuthService;
  database: BackendDatabaseService;
  storage: BackendStorageService;
  setJWT(jwt: string | null): void;
  Query: {
    equal(attribute: string, value: unknown): unknown;
    notEqual(attribute: string, value: unknown): unknown;
    lessThan(attribute: string, value: unknown): unknown;
    greaterThan(attribute: string, value: unknown): unknown;
    search(attribute: string, value: string): unknown;
    orderAsc(attribute: string): unknown;
    orderDesc(attribute: string): unknown;
    limit(limit: number): unknown;
    offset(offset: number): unknown;
  };
}
```

### BackendConfig

Backend configuration interface.

```typescript
interface BackendConfig {
  provider: 'firebase' | 'supabase' | 'custom';
  endpoint?: string;
  projectId: string;
  apiKey?: string;
  [key: string]: unknown;
}
```

## Component Props Types

### AuthContextValue

Authentication context value type.

```typescript
interface AuthContextValue {
  user: AuthUser | null;
  isPending: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmailPassword: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  getJwt: () => Promise<string | null>;
}
```

### ProtectedRouteProps

Props for the ProtectedRoute component.

```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
}
```

### NotificationPanelProps

Props for the NotificationPanel component.

```typescript
interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  unreadCount: number;
  onUnreadCountChange: (count: number) => void;
}
```

### FileUploadZoneProps

Props for the FileUploadZone component.

```typescript
interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onFileRemove: () => void;
  accept?: string;
  maxSize?: number;
  className?: string;
  loading?: boolean;
}
```

### DocumentPreviewProps

Props for the DocumentPreview component.

```typescript
interface DocumentPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  document: {
    id: string;
    title: string;
    file_url?: string | null;
    status: string;
    created_at: string;
    version: number;
  } | null;
}
```

### StatCardProps

Props for the StatCard component.

```typescript
interface StatCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  href?: string;
  trend?: number;
}
```

## Utility Types

### NotificationItem

Represents a notification in the system.

```typescript
interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'deadline' | 'hearing' | 'payment' | 'document' | 'message' | 'system';
  is_read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  action_url?: string;
  created_at: string;
  related_matter_id?: string;
}
```

### DocumentGenerationOptions

Options for document generation.

```typescript
interface DocumentGenerationOptions {
  template: {
    body: string;
    variables: string[];
    output_type: 'docx' | 'pdf';
  };
  variables: Record<string, string>;
  title: string;
}
```

### EmailAddress

Represents an email address.

```typescript
interface EmailAddress {
  email: string;
  name?: string;
}
```

### EmailContent

Represents email content.

```typescript
interface EmailContent {
  subject: string;
  text: string;
  html?: string;
}
```

### EmailContext

Context for email operations.

```typescript
interface EmailContext {
  matter_id: number;
  deadline_id?: number;
  hearing_id?: number;
  type: 'deadline' | 'hearing' | 'reminder';
}
```

## Zod Schemas

### UserProfileSchema

Zod schema for user profile validation.

```typescript
const UserProfileSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  role: z.enum(['Admin', 'Attorney', 'Staff', 'Client']),
  bar_number: z.string().nullable(),
  practice_areas: z.string().nullable(),
  phone: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});
```

### ClientSchema

Zod schema for client validation.

```typescript
const ClientSchema = z.object({
  id: z.number(),
  client_number: z.string().nullable(),
  first_name: z.string(),
  last_name: z.string(),
  date_of_birth: z.string().nullable(),
  ssn_last4: z.string().nullable(),
  phones: z.string().nullable(),
  email: z.string().nullable(),
  address: z.string().nullable(),
  emergency_contact: z.string().nullable(),
  preferred_contact_method: z.enum(['Email', 'Phone', 'SMS']).nullable(),
  notifications_opt_in: z.boolean(),
  portal_enabled: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});
```

### MatterSchema

Zod schema for matter validation.

```typescript
const MatterSchema = z.object({
  id: z.number(),
  matter_number: z.string(),
  title: z.string(),
  practice_area: z.enum(['Criminal', 'PersonalInjury', 'SSD']),
  status: z.enum(['Intake', 'Open', 'Pending', 'Closed']),
  client_id: z.number(),
  assigned_attorney_ids: z.string().nullable(),
  opened_at: z.string().nullable(),
  closed_at: z.string().nullable(),
  description: z.string().nullable(),
  fee_model: z.enum(['FlatRate', 'Progressive']),
  flat_rate_amount: z.number().nullable(),
  rate_card_id: z.number().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  client_first_name: z.string().optional(),
  client_last_name: z.string().optional(),
  client_email: z.string().optional(),
});
```

### DocumentSchema

Zod schema for document validation.

```typescript
const DocumentSchema = z.object({
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
```

### InvoiceSchema

Zod schema for invoice validation.

```typescript
const InvoiceSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(val => typeof val === 'string' ? val : val.toString()),
  matter_id: z.union([z.string(), z.number()]).transform(val => typeof val === 'string' ? parseInt(val) : val),
  invoice_number: z.string(),
  description: z.string().optional(),
  amount: z.union([z.string(), z.number()]).transform(val => typeof val === 'string' ? parseFloat(val) : val),
  total: z.union([z.string(), z.number()]).transform(val => typeof val === 'string' ? parseFloat(val) : val),
  status: z.enum(['Draft', 'Sent', 'Paid', 'Overdue']),
  due_date: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  created_by: z.string(),
});
```

### PaymentSchema

Zod schema for payment validation.

```typescript
const PaymentSchema = z.object({
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
```

### TaskSchema

Zod schema for task validation.

```typescript
const TaskSchema = z.object({
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
  days_until_due: z.number().optional(),
});
```

### CreateMatterSchema

Zod schema for creating matters.

```typescript
const CreateMatterSchema = z.object({
  client_id: z.number(),
  title: z.string().min(1),
  practice_area: z.enum(['Criminal', 'PersonalInjury', 'SSD']),
  description: z.string().optional(),
  fee_model: z.enum(['FlatRate', 'Progressive']),
  flat_rate_amount: z.number().optional(),
});
```

### CreateClientSchema

Zod schema for creating clients.

```typescript
const CreateClientSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  preferred_contact_method: z.enum(['Email', 'Phone', 'SMS']).optional(),
});
```

### DashboardStatsSchema

Zod schema for dashboard statistics.

```typescript
const DashboardStatsSchema = z.object({
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
```

## Type Guards

### Type Guard Functions

```typescript
// Check if value is a valid user role
function isUserRole(value: string): value is 'Admin' | 'Attorney' | 'Staff' | 'Client' {
  return ['Admin', 'Attorney', 'Staff', 'Client'].includes(value);
}

// Check if value is a valid practice area
function isPracticeArea(value: string): value is 'Criminal' | 'PersonalInjury' | 'SSD' {
  return ['Criminal', 'PersonalInjury', 'SSD'].includes(value);
}

// Check if value is a valid matter status
function isMatterStatus(value: string): value is 'Intake' | 'Open' | 'Pending' | 'Closed' {
  return ['Intake', 'Open', 'Pending', 'Closed'].includes(value);
}

// Check if value is a valid task status
function isTaskStatus(value: string): value is 'Open' | 'InProgress' | 'Completed' {
  return ['Open', 'InProgress', 'Completed'].includes(value);
}

// Check if value is a valid payment method
function isPaymentMethod(value: string): value is 'Cash' | 'Check' | 'Credit Card' | 'Bank Transfer' | 'Other' {
  return ['Cash', 'Check', 'Credit Card', 'Bank Transfer', 'Other'].includes(value);
}

// Check if value is a valid notification type
function isNotificationType(value: string): value is 'deadline' | 'hearing' | 'payment' | 'document' | 'message' | 'system' {
  return ['deadline', 'hearing', 'payment', 'document', 'message', 'system'].includes(value);
}

// Check if value is a valid notification priority
function isNotificationPriority(value: string): value is 'low' | 'medium' | 'high' | 'urgent' {
  return ['low', 'medium', 'high', 'urgent'].includes(value);
}
```

## Type Utilities

### Utility Types

```typescript
// Extract the type from a Zod schema
type UserProfile = z.infer<typeof UserProfileSchema>;
type Client = z.infer<typeof ClientSchema>;
type Matter = z.infer<typeof MatterSchema>;
type Document = z.infer<typeof DocumentSchema>;
type Invoice = z.infer<typeof InvoiceSchema>;
type Payment = z.infer<typeof PaymentSchema>;
type Task = z.infer<typeof TaskSchema>;
type CreateMatterRequest = z.infer<typeof CreateMatterSchema>;
type CreateClientRequest = z.infer<typeof CreateClientSchema>;
type DashboardStats = z.infer<typeof DashboardStatsSchema>;

// Make all properties optional
type PartialUserProfile = Partial<UserProfile>;
type PartialClient = Partial<Client>;
type PartialMatter = Partial<Matter>;

// Make all properties required
type RequiredUserProfile = Required<UserProfile>;
type RequiredClient = Required<Client>;
type RequiredMatter = Required<Matter>;

// Pick specific properties
type UserProfileBasic = Pick<UserProfile, 'id' | 'first_name' | 'last_name' | 'email'>;
type ClientBasic = Pick<Client, 'id' | 'first_name' | 'last_name' | 'email'>;
type MatterBasic = Pick<Matter, 'id' | 'title' | 'status' | 'practice_area'>;

// Omit specific properties
type UserProfileWithoutId = Omit<UserProfile, 'id'>;
type ClientWithoutId = Omit<Client, 'id'>;
type MatterWithoutId = Omit<Matter, 'id'>;

// Create a type with specific properties as optional
type UserProfileUpdate = Partial<Pick<UserProfile, 'first_name' | 'last_name' | 'phone' | 'email'>> & Pick<UserProfile, 'id'>;
type ClientUpdate = Partial<Pick<Client, 'first_name' | 'last_name' | 'phone' | 'email' | 'address'>> & Pick<Client, 'id'>;
type MatterUpdate = Partial<Pick<Matter, 'title' | 'description' | 'status'>> & Pick<Matter, 'id'>;

// Create union types for form states
type FormState = 'idle' | 'loading' | 'success' | 'error';
type ModalState = 'closed' | 'opening' | 'open' | 'closing';

// Create generic response types
type ApiResponse<T> = {
  data: T;
  success: boolean;
  message?: string;
};

type ApiError = {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
};

// Create pagination types
type PaginationParams = {
  page: number;
  limit: number;
  offset: number;
};

type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
```

### Collection Constants

```typescript
const COLLECTIONS = {
  userProfiles: 'user_profiles',
  clients: 'clients',
  matters: 'matters',
  mattersMeta: 'matters_meta',
  hearings: 'hearings',
  documents: 'documents',
  documentTemplates: 'document_templates',
  documentVersions: 'document_versions',
  deadlines: 'deadlines',
  timeEntries: 'time_entries',
  tasks: 'tasks',
  invoices: 'invoices',
  payments: 'payments',
  communications: 'communications',
  deadlineNotes: 'deadline_notes',
  notifications: 'notifications',
} as const;

const BUCKETS = {
  documents: 'documents',
} as const;

const DATABASE_ID = 'jusivo';
```

### Type-safe Collection Access

```typescript
type CollectionName = keyof typeof COLLECTIONS;
type BucketName = keyof typeof BUCKETS;

// Type-safe collection access
function getCollection<T extends CollectionName>(name: T): string {
  return COLLECTIONS[name];
}

function getBucket<T extends BucketName>(name: T): string {
  return BUCKETS[name];
}
```

This comprehensive types and schemas documentation provides a complete reference for all data models, validation schemas, and type definitions used throughout the Jusivo Case Manager application. The types are designed to ensure type safety, data validation, and consistent API contracts across the entire system.