# Jusivo Case Manager - API Documentation

## Overview

Jusivo Case Manager is a comprehensive legal case management system built with React, TypeScript, and Firebase. This document provides detailed information about all public APIs, functions, and components.

## Table of Contents

1. [Backend Services](#backend-services)
2. [Type Definitions](#type-definitions)
3. [Authentication](#authentication)
4. [Database Operations](#database-operations)
5. [Storage Operations](#storage-operations)
6. [Utility Functions](#utility-functions)
7. [React Components](#react-components)
8. [Pages](#pages)
9. [Usage Examples](#usage-examples)

## Backend Services

### BackendService Interface

The main backend service interface that provides access to authentication, database, and storage operations.

```typescript
interface BackendService {
  auth: BackendAuthService;
  database: BackendDatabaseService;
  storage: BackendStorageService;
  setJWT(jwt: string | null): void;
  Query: QueryBuilder;
}
```

### BackendAuthService

Handles user authentication operations.

```typescript
interface BackendAuthService {
  getCurrentUser(): Promise<BackendUser | null>;
  get(): Promise<BackendUser | null>; // Legacy compatibility
  loginWithGoogle(successUrl: string, failureUrl: string): Promise<void>;
  loginWithEmailPassword(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
  createJWT(): Promise<{ jwt: string }>;
}
```

**Usage Example:**
```typescript
import { getBackendService } from '@/react-app/lib/backend';

const backend = getBackendService();

// Get current user
const user = await backend.auth.getCurrentUser();

// Login with Google
await backend.auth.loginWithGoogle(
  'https://yourapp.com/success',
  'https://yourapp.com/failure'
);

// Login with email/password
await backend.auth.loginWithEmailPassword('user@example.com', 'password');
```

### BackendDatabaseService

Handles database operations for all collections.

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

**Usage Example:**
```typescript
import { databases, DATABASE_ID, COLLECTIONS, Query } from '@/react-app/lib/backend';

// List all clients
const clients = await databases.listDocuments(
  DATABASE_ID,
  COLLECTIONS.clients,
  [Query.limit(50)]
);

// Get a specific matter
const matter = await databases.getDocument(
  DATABASE_ID,
  COLLECTIONS.matters,
  'matter-id-123'
);

// Create a new client
const newClient = await databases.createDocument(
  DATABASE_ID,
  COLLECTIONS.clients,
  'unique()',
  {
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com'
  }
);

// Update a matter
await databases.updateDocument(
  DATABASE_ID,
  COLLECTIONS.matters,
  'matter-id-123',
  { status: 'Closed' }
);
```

### BackendStorageService

Handles file storage operations.

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

**Usage Example:**
```typescript
import { storage, BUCKETS } from '@/react-app/lib/backend';

// Upload a file
const file = new File(['content'], 'document.pdf', { type: 'application/pdf' });
const uploadedFile = await storage.createFile(
  BUCKETS.documents,
  'unique()',
  file
);

// Get file download URL
const downloadUrl = storage.getFileDownload(
  BUCKETS.documents,
  'file-id-123'
);
```

## Type Definitions

### Core Entity Types

#### UserProfile
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

#### Client
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

#### Matter
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

#### Document
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

#### Invoice
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

#### Payment
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

#### Task
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

#### Communication
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

### Request/Response Types

#### CreateMatterRequest
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

#### CreateClientRequest
```typescript
interface CreateClientRequest {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  preferred_contact_method?: 'Email' | 'Phone' | 'SMS';
}
```

#### DashboardStats
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

## Authentication

### AuthProvider Component

The `AuthProvider` component manages authentication state throughout the application.

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

**Usage Example:**
```typescript
import { useAuth } from '@/react-app/auth/AuthProvider';

function MyComponent() {
  const { user, loginWithGoogle, logout, isPending } = useAuth();

  if (isPending) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return (
      <button onClick={loginWithGoogle}>
        Login with Google
      </button>
    );
  }

  return (
    <div>
      <p>Welcome, {user.name || user.email}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### ProtectedRoute Component

A wrapper component that protects routes requiring authentication.

```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
}
```

**Usage Example:**
```typescript
import ProtectedRoute from '@/react-app/components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      } />
    </Routes>
  );
}
```

## Database Operations

### Query Builder

The Query builder provides a fluent interface for constructing database queries.

```typescript
const Query = {
  equal(attribute: string, value: unknown): string;
  notEqual(attribute: string, value: unknown): string;
  lessThan(attribute: string, value: unknown): string;
  greaterThan(attribute: string, value: unknown): string;
  lessThanEqual(attribute: string, value: unknown): string;
  greaterThanEqual(attribute: string, value: unknown): string;
  search(attribute: string, value: string): string;
  orderAsc(attribute: string): string;
  orderDesc(attribute: string): string;
  limit(limit: number): string;
  offset(offset: number): string;
};
```

**Usage Examples:**
```typescript
// Get all open matters for a specific client
const openMatters = await databases.listDocuments(
  DATABASE_ID,
  COLLECTIONS.matters,
  [
    Query.equal('client_id', clientId),
    Query.equal('status', 'Open'),
    Query.orderDesc('created_at'),
    Query.limit(20)
  ]
);

// Get matters due this week
const now = new Date().toISOString();
const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

const dueMatters = await databases.listDocuments(
  DATABASE_ID,
  COLLECTIONS.deadlines,
  [
    Query.equal('status', 'Open'),
    Query.greaterThanEqual('due_at', now),
    Query.lessThanEqual('due_at', nextWeek)
  ]
);
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
```

## Storage Operations

### File Upload and Management

```typescript
// Upload a document
const uploadDocument = async (file: File, matterId: string) => {
  try {
    // Upload file to storage
    const uploadedFile = await storage.createFile(
      BUCKETS.documents,
      'unique()',
      file
    );

    // Create document record
    const document = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.documents,
      'unique()',
      {
        matter_id: parseInt(matterId),
        title: file.name,
        file_url: `storage://${BUCKETS.documents}/${uploadedFile.$id}`,
        status: 'Draft',
        version: 1,
        created_by: user?.$id
      }
    );

    return document;
  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
};
```

### URL Resolution

```typescript
import { resolveViewUrl, resolveDownloadUrl } from '@/react-app/lib/storage-url';

// Resolve storage URLs for viewing/downloading
const viewUrl = resolveViewUrl(document.file_url);
const downloadUrl = resolveDownloadUrl(document.file_url);
```

## Utility Functions

### Dashboard Statistics

```typescript
import { fetchDashboardStats } from '@/react-app/lib/dashboard';

// Get dashboard statistics
const stats = await fetchDashboardStats();
console.log(stats.open_matters_by_practice.Criminal);
console.log(stats.upcoming_hearings);
```

### Client Balances

```typescript
import { fetchClientBalances, fetchClientBalance } from '@/react-app/lib/client-balances';

// Get all client balances
const balances = await fetchClientBalances();

// Get balance for specific client
const clientBalance = await fetchClientBalance('client-id-123');
```

### Notifications

```typescript
import {
  fetchNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
} from '@/react-app/lib/notifications';

// Get notifications
const { notifications, unreadCount } = await fetchNotifications('all');

// Mark notification as read
await markAsRead('notification-id-123');

// Get unread count
const unreadCount = await getUnreadCount();
```

### Document Generation

```typescript
import { generateDocumentContent, downloadDocument } from '@/shared/document-generator';

// Generate document from template
const result = await generateDocumentContent({
  template: {
    body: 'Hello {{client_name}}, your case {{matter_number}} is proceeding well.',
    variables: ['client_name', 'matter_number'],
    output_type: 'pdf'
  },
  variables: {
    client_name: 'John Doe',
    matter_number: '2024-001'
  },
  title: 'Client Update Letter'
});

// Download the generated document
downloadDocument(result.blob, result.filename);
```

### Email Service

```typescript
import { EmailService } from '@/shared/email-service';

const emailService = new EmailService('your-sendgrid-api-key', 'https://yourapp.com');

// Send deadline reminder
await emailService.sendDeadlineReminder(
  {
    id: 123,
    title: 'State v. Johnson',
    matter_number: '2024-001',
    client_first_name: 'John',
    client_last_name: 'Johnson'
  },
  {
    id: 456,
    title: 'Discovery Deadline',
    due_at: '2024-02-15T10:00:00Z'
  },
  [
    {
      notify_deadlines: true,
      email: 'attorney@lawfirm.com',
      name: 'Attorney Name'
    }
  ]
);
```

## React Components

### DashboardLayout

The main layout component that provides navigation and structure.

```typescript
interface DashboardLayoutProps {
  // No props - uses context and routing
}
```

**Features:**
- Sidebar navigation
- User profile display
- Notification panel
- Search functionality
- Responsive design

### NotificationPanel

A dropdown panel for displaying and managing notifications.

```typescript
interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  unreadCount: number;
  onUnreadCountChange: (count: number) => void;
}
```

**Usage Example:**
```typescript
import NotificationPanel from '@/react-app/components/NotificationPanel';

function Header() {
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  return (
    <div>
      <button onClick={() => setNotificationPanelOpen(true)}>
        Notifications ({unreadCount})
      </button>
      
      <NotificationPanel
        isOpen={notificationPanelOpen}
        onClose={() => setNotificationPanelOpen(false)}
        unreadCount={unreadCount}
        onUnreadCountChange={setUnreadCount}
      />
    </div>
  );
}
```

### FileUploadZone

A drag-and-drop file upload component.

```typescript
interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onFileRemove: () => void;
  accept?: string;
  maxSize?: number; // in bytes
  className?: string;
  loading?: boolean;
}
```

**Usage Example:**
```typescript
import FileUploadZone from '@/react-app/components/FileUploadZone';

function DocumentUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
  };

  return (
    <FileUploadZone
      onFileSelect={handleFileSelect}
      selectedFile={selectedFile}
      onFileRemove={handleFileRemove}
      accept=".pdf,.doc,.docx"
      maxSize={10 * 1024 * 1024} // 10MB
      loading={uploading}
    />
  );
}
```

### DocumentPreview

A modal component for previewing documents.

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

**Usage Example:**
```typescript
import DocumentPreview from '@/react-app/components/DocumentPreview';

function DocumentList() {
  const [previewDoc, setPreviewDoc] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div>
      {documents.map(doc => (
        <div key={doc.id} onClick={() => {
          setPreviewDoc(doc);
          setShowPreview(true);
        }}>
          {doc.title}
        </div>
      ))}
      
      <DocumentPreview
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        document={previewDoc}
      />
    </div>
  );
}
```

## Pages

### Dashboard

The main dashboard page displaying key statistics and quick actions.

**Features:**
- Practice area statistics
- Upcoming deadlines and hearings
- Recent activity feed
- Quick action buttons

### MatterDetail

A comprehensive page for viewing and managing individual matters.

**Features:**
- Matter overview and client information
- Timeline of events
- Document management
- Billing and invoicing
- Task management
- Communication tracking
- Court settings

**Tabs:**
- Overview: Basic matter information and case details
- Timeline: Chronological view of all matter events
- Documents: File management and preview
- Billing: Time entries, invoices, and payments
- Communications: Email and phone call tracking
- Tasks: Task management and assignment
- Settings: Court and hearing information

### Clients

A page for managing client information and relationships.

**Features:**
- Client list with search and filtering
- Client detail views
- Contact information management
- Portal access controls

### Documents

A centralized document management page.

**Features:**
- Document library
- Template management
- Document generation
- File upload and organization

## Usage Examples

### Creating a New Matter

```typescript
import { databases, DATABASE_ID, COLLECTIONS } from '@/react-app/lib/backend';

const createMatter = async (clientId: number, matterData: CreateMatterRequest) => {
  try {
    const matter = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.matters,
      'unique()',
      {
        ...matterData,
        matter_number: `MAT-${Date.now()}`,
        status: 'Intake',
        opened_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    );
    
    return matter;
  } catch (error) {
    console.error('Error creating matter:', error);
    throw error;
  }
};
```

### Recording Time Entries

```typescript
const recordTimeEntry = async (matterId: number, description: string, hours: number, rate: number) => {
  try {
    const timeEntry = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.timeEntries,
      'unique()',
      {
        matter_id: matterId,
        description,
        hours,
        rate,
        entry_date: new Date().toISOString(),
        created_by: user?.$id,
        created_at: new Date().toISOString()
      }
    );
    
    return timeEntry;
  } catch (error) {
    console.error('Error recording time entry:', error);
    throw error;
  }
};
```

### Generating Invoices

```typescript
const generateInvoice = async (matterId: number, timeEntries: TimeEntry[]) => {
  try {
    const lineItems = timeEntries.map(entry => ({
      description: entry.description,
      quantity: entry.hours,
      rate: entry.rate,
      amount: entry.hours * entry.rate
    }));

    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const invoiceNumber = `INV-${Date.now()}`;

    const invoice = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.invoices,
      'unique()',
      {
        matter_id: matterId,
        invoice_number: invoiceNumber,
        line_items: JSON.stringify(lineItems),
        subtotal,
        total: subtotal,
        status: 'Draft',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        created_by: user?.$id
      }
    );

    return invoice;
  } catch (error) {
    console.error('Error generating invoice:', error);
    throw error;
  }
};
```

### Managing Tasks

```typescript
const createTask = async (matterId: number, taskData: Partial<Task>) => {
  try {
    const task = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.tasks,
      'unique()',
      {
        matter_id: matterId,
        title: taskData.title,
        description: taskData.description,
        status: 'Open',
        due_at: taskData.due_at,
        created_at: new Date().toISOString()
      }
    );

    return task;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};

const updateTaskStatus = async (taskId: string, status: 'Open' | 'InProgress' | 'Completed') => {
  try {
    await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.tasks,
      taskId,
      { 
        status,
        updated_at: new Date().toISOString()
      }
    );
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
};
```

## Error Handling

All API functions should be wrapped in try-catch blocks for proper error handling:

```typescript
const handleApiCall = async () => {
  try {
    const result = await someApiFunction();
    // Handle success
    return result;
  } catch (error) {
    console.error('API Error:', error);
    // Handle error appropriately
    throw error;
  }
};
```

## Best Practices

1. **Always use TypeScript types** for better development experience and error prevention
2. **Handle loading states** when making API calls
3. **Implement proper error handling** with user-friendly error messages
4. **Use the Query builder** for consistent database queries
5. **Validate input data** before making API calls
6. **Use the provided utility functions** for common operations
7. **Follow the established patterns** for component structure and data flow

## Configuration

The application uses environment variables for configuration:

```bash
# Firebase Configuration
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket

# Backend Provider
VITE_BACKEND_PROVIDER=firebase
```

This documentation covers all the major APIs and components in the Jusivo Case Manager application. For more specific implementation details, refer to the source code and inline comments.