# Jusivo Case Manager - Component Documentation

## Overview

This document provides detailed documentation for all React components in the Jusivo Case Manager application, including props, usage examples, and implementation details.

## Table of Contents

1. [Layout Components](#layout-components)
2. [UI Components](#ui-components)
3. [Form Components](#form-components)
4. [Data Display Components](#data-display-components)
5. [Modal Components](#modal-components)
6. [Utility Components](#utility-components)
7. [Page Components](#page-components)

## Layout Components

### DashboardLayout

The main layout component that provides the application shell with navigation, header, and content areas.

**Location:** `src/react-app/components/DashboardLayout.tsx`

**Props:** None (uses React Router and Auth context)

**Features:**
- Fixed sidebar navigation
- User profile display
- Notification panel integration
- Search functionality
- Responsive design
- Background decorative elements

**Usage:**
```typescript
import DashboardLayout from '@/react-app/components/DashboardLayout';

function App() {
  return (
    <Routes>
      <Route path="/" element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="clients" element={<Clients />} />
        {/* Other routes */}
      </Route>
    </Routes>
  );
}
```

**Navigation Items:**
- Dashboard
- Clients
- Matters
- Calendar
- Deadlines
- Documents
- Communications
- Billing
- Settings

**Key Features:**
- Gradient background with decorative elements
- Glassmorphism design with backdrop blur
- User avatar with fallback
- Notification bell with unread count
- Quick action buttons (New Intake, New Client)

### ProtectedRoute

A wrapper component that protects routes requiring authentication.

**Location:** `src/react-app/components/ProtectedRoute.tsx`

**Props:**
```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
}
```

**Usage:**
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

**Features:**
- Loading state with spinner
- Automatic redirect to login for unauthenticated users
- Uses AuthProvider context

## UI Components

### NotificationPanel

A dropdown panel for displaying and managing notifications.

**Location:** `src/react-app/components/NotificationPanel.tsx`

**Props:**
```typescript
interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  unreadCount: number;
  onUnreadCountChange: (count: number) => void;
}
```

**Usage:**
```typescript
import NotificationPanel from '@/react-app/components/NotificationPanel';

function Header() {
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  return (
    <div className="relative">
      <button 
        onClick={() => setNotificationPanelOpen(true)}
        className="relative p-3 text-blue-200 hover:text-white"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 text-xs font-medium text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
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

**Features:**
- Filter by all/unread notifications
- Mark individual or all notifications as read
- Delete notifications
- Click outside to close
- Time formatting (e.g., "2h ago", "3d ago")
- Priority indicators
- Action URL navigation

**Notification Types:**
- `deadline`: Clock icon, blue color
- `hearing`: Calendar icon, purple color
- `payment`: DollarSign icon, green color
- `document`: FileText icon, indigo color
- `message`: MessageSquare icon, yellow color
- `system`: Settings icon, gray color

### FileUploadZone

A drag-and-drop file upload component with validation and preview.

**Location:** `src/react-app/components/FileUploadZone.tsx`

**Props:**
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

**Usage:**
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
      accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
      maxSize={10 * 1024 * 1024} // 10MB
      loading={uploading}
      className="mb-4"
    />
  );
}
```

**Features:**
- Drag and drop support
- File type validation
- File size validation
- Visual feedback for different states
- File icon display
- File size formatting
- Loading state support
- Error message display

**Supported File Types:**
- PDF: 📄
- Word documents: 📝
- Text files: 📋
- Images: 🖼️
- Other files: 📁

### DocumentPreview

A modal component for previewing various document types.

**Location:** `src/react-app/components/DocumentPreview.tsx`

**Props:**
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

**Usage:**
```typescript
import DocumentPreview from '@/react-app/components/DocumentPreview';

function DocumentList() {
  const [previewDoc, setPreviewDoc] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div>
      {documents.map(doc => (
        <div 
          key={doc.id} 
          onClick={() => {
            setPreviewDoc(doc);
            setShowPreview(true);
          }}
          className="cursor-pointer hover:bg-gray-50 p-4 border rounded"
        >
          <h3>{doc.title}</h3>
          <p>Version {doc.version} • {doc.status}</p>
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

**Features:**
- PDF preview with iframe
- Image preview with zoom and rotate
- Text file preview
- Download functionality
- Open in new tab
- Zoom controls (50% - 200%)
- Rotation controls
- Error handling for unsupported formats
- Loading states

**Supported Preview Types:**
- PDF: Full iframe preview
- Images (JPG, PNG, GIF, WebP): Zoom and rotate support
- Text files: Basic text display
- Office documents: Download-only (no preview)

## Form Components

### ClientFilterModal

A modal for filtering and searching clients.

**Location:** `src/react-app/components/ClientFilterModal.tsx`

**Props:**
```typescript
interface ClientFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: ClientFilters) => void;
  initialFilters?: ClientFilters;
}
```

**Usage:**
```typescript
import ClientFilterModal from '@/react-app/components/ClientFilterModal';

function ClientsPage() {
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState<ClientFilters>({});

  const handleApplyFilters = (newFilters: ClientFilters) => {
    setFilters(newFilters);
    // Apply filters to client list
  };

  return (
    <div>
      <button onClick={() => setShowFilterModal(true)}>
        Filter Clients
      </button>
      
      <ClientFilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApplyFilters={handleApplyFilters}
        initialFilters={filters}
      />
    </div>
  );
}
```

**Features:**
- Search by name, email, phone
- Filter by practice area
- Filter by status
- Date range filters
- Portal access filters
- Clear all filters
- Apply and cancel actions

### ClientActionsMenu

A dropdown menu for client actions.

**Location:** `src/react-app/components/ClientActionsMenu.tsx`

**Props:**
```typescript
interface ClientActionsMenuProps {
  clientId: string;
  clientName: string;
  onEdit: () => void;
  onViewMatters: () => void;
  onSendMessage: () => void;
  onTogglePortal: () => void;
  portalEnabled: boolean;
}
```

**Usage:**
```typescript
import ClientActionsMenu from '@/react-app/components/ClientActionsMenu';

function ClientRow({ client }) {
  const handleEdit = () => {
    // Navigate to edit client page
  };

  const handleViewMatters = () => {
    // Navigate to client's matters
  };

  return (
    <div className="flex items-center justify-between">
      <div>
        <h3>{client.first_name} {client.last_name}</h3>
        <p>{client.email}</p>
      </div>
      
      <ClientActionsMenu
        clientId={client.id}
        clientName={`${client.first_name} ${client.last_name}`}
        onEdit={handleEdit}
        onViewMatters={handleViewMatters}
        onSendMessage={() => {}}
        onTogglePortal={() => {}}
        portalEnabled={client.portal_enabled}
      />
    </div>
  );
}
```

**Features:**
- Edit client information
- View client matters
- Send message/email
- Toggle portal access
- Delete client (with confirmation)
- Context menu positioning

## Data Display Components

### StatCard

A reusable card component for displaying statistics.

**Location:** Used in `src/react-app/pages/Dashboard.tsx`

**Props:**
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

**Usage:**
```typescript
function StatCard({ title, value, icon: Icon, color, href, trend }: StatCardProps) {
  const content = (
    <div className="bg-white/8 backdrop-blur-xl rounded-2xl shadow-xl border border-white/10 p-6 hover:shadow-2xl hover:bg-white/12 transition-all duration-300 hover:scale-[1.02] group">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-blue-200 mb-1">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {trend !== undefined && (
            <div className="flex items-center mt-2">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600 font-medium">+{trend}% this month</span>
            </div>
          )}
        </div>
        <div className={`w-16 h-16 ${color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
      </div>
    </div>
  );

  return href ? <Link to={href}>{content}</Link> : content;
}

// Usage
<StatCard
  title="Criminal Cases"
  value={stats?.open_matters_by_practice.Criminal || 0}
  icon={FolderOpen}
  color="bg-gradient-to-br from-red-500 to-red-600"
  href="/matters?practice_area=Criminal"
  trend={12}
/>
```

**Features:**
- Hover animations
- Optional trend indicators
- Clickable links
- Icon integration
- Gradient backgrounds
- Responsive design

## Modal Components

### Invoice Generation Modal

A complex modal for generating invoices from time entries and custom line items.

**Location:** Used in `src/react-app/pages/MatterDetail.tsx`

**Features:**
- Time entry selection
- Custom line item creation
- Tax and discount calculations
- Real-time total updates
- Date pickers for issue and due dates
- Line item management (add, edit, remove)

**Usage:**
```typescript
const [showInvoiceModal, setShowInvoiceModal] = useState(false);
const [invoiceLineItems, setInvoiceLineItems] = useState([]);

// In JSX
{showInvoiceModal && (
  <div className="fixed inset-0 z-50 overflow-y-auto">
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowInvoiceModal(false)} />
      <div className="relative bg-gray-900 rounded-xl shadow-xl border border-white/10 p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal content */}
      </div>
    </div>
  </div>
)}
```

### Task Management Modal

A modal for creating and editing tasks.

**Location:** Used in `src/react-app/pages/MatterDetail.tsx`

**Features:**
- Task title and description
- Due date selection
- Status management
- Form validation
- Create and update modes

**Usage:**
```typescript
const [showTaskModal, setShowTaskModal] = useState(false);
const [editingTask, setEditingTask] = useState(null);
const [taskForm, setTaskForm] = useState({
  title: '',
  description: '',
  due_at: '',
  status: 'Open'
});

const openTaskModal = (task) => {
  if (task) {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      due_at: task.due_at || '',
      status: task.status
    });
  } else {
    setTaskForm({
      title: '',
      description: '',
      due_at: '',
      status: 'Open'
    });
    setEditingTask(null);
  }
  setShowTaskModal(true);
};
```

### Payment Recording Modal

A modal for recording payments against invoices.

**Location:** Used in `src/react-app/pages/MatterDetail.tsx`

**Features:**
- Payment amount input
- Payment method selection
- Reference number input
- Automatic invoice status updates
- Form validation

## Utility Components

### Loading Spinner

A reusable loading spinner component.

**Usage:**
```typescript
function LoadingSpinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-blue-600 border-t-transparent ${sizeClasses[size]} ${className}`} />
  );
}
```

### Error Message

A standardized error message component.

**Usage:**
```typescript
function ErrorMessage({ message, onRetry, className = '' }) {
  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center">
        <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
        <p className="text-red-600">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="ml-auto text-red-700 hover:text-red-800 underline"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
```

### Success Message

A standardized success message component.

**Usage:**
```typescript
function SuccessMessage({ message, className = '' }) {
  return (
    <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center">
        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
        <p className="text-green-600">{message}</p>
      </div>
    </div>
  );
}
```

## Page Components

### Dashboard

The main dashboard page displaying key statistics and quick actions.

**Location:** `src/react-app/pages/Dashboard.tsx`

**Features:**
- Practice area statistics cards
- Upcoming hearings and deadlines
- Recent activity feed
- Quick action buttons
- Loading states
- Error handling

**Key Sections:**
1. **Header**: Welcome message and action buttons
2. **Stats Grid**: Practice area statistics with trends
3. **Today's Schedule**: Upcoming events
4. **Recent Activity**: Latest system events
5. **Quick Actions**: Common task shortcuts

### MatterDetail

A comprehensive page for viewing and managing individual matters.

**Location:** `src/react-app/pages/MatterDetail.tsx`

**Features:**
- Tabbed interface for different aspects
- Matter overview and client information
- Timeline of events
- Document management
- Billing and invoicing
- Task management
- Communication tracking
- Court settings

**Tabs:**
1. **Overview**: Basic matter information and case details
2. **Timeline**: Chronological view of all matter events
3. **Documents**: File management and preview
4. **Billing**: Time entries, invoices, and payments
5. **Communications**: Email and phone call tracking
6. **Tasks**: Task management and assignment
7. **Settings**: Court and hearing information

**Key Features:**
- Real-time data updates
- Form validation
- Modal integrations
- File upload support
- Invoice generation
- Payment recording
- Task management
- Document preview

### Clients

A page for managing client information and relationships.

**Location:** `src/react-app/pages/Clients.tsx`

**Features:**
- Client list with search and filtering
- Client detail views
- Contact information management
- Portal access controls
- Bulk actions
- Export functionality

### Matters

A page for managing all matters across the system.

**Location:** `src/react-app/pages/Matters.tsx`

**Features:**
- Matter list with filtering
- Practice area grouping
- Status management
- Quick actions
- Search functionality
- Bulk operations

### Documents

A centralized document management page.

**Location:** `src/react-app/pages/Documents.tsx`

**Features:**
- Document library
- Template management
- Document generation
- File upload and organization
- Version control
- Search and filtering

### Billing

A comprehensive billing and invoicing page.

**Location:** `src/react-app/pages/Billing.tsx`

**Features:**
- Invoice management
- Payment tracking
- Time entry management
- Financial reporting
- Client balance overview
- Payment processing

### Calendar

A calendar view for hearings, deadlines, and appointments.

**Location:** `src/react-app/pages/Calendar.tsx`

**Features:**
- Monthly/weekly/daily views
- Event creation and editing
- Hearing scheduling
- Deadline tracking
- Appointment management
- Integration with matters

### Deadlines

A dedicated page for managing deadlines and important dates.

**Location:** `src/react-app/pages/Deadlines.tsx`

**Features:**
- Deadline list with filtering
- Status management
- Priority indicators
- Due date tracking
- Bulk operations
- Email notifications

### Communications

A page for managing all client communications.

**Location:** `src/react-app/pages/Communications.tsx`

**Features:**
- Communication history
- Email integration
- Phone call logging
- Message templates
- Client portal messages
- Search and filtering

### Settings

A page for system configuration and user preferences.

**Location:** `src/react-app/pages/Settings.tsx`

**Features:**
- User profile management
- System preferences
- Notification settings
- Integration configuration
- Backup and export
- Security settings

## Component Patterns

### State Management

Most components use React hooks for state management:

```typescript
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
const [data, setData] = useState(null);

useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await apiCall();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);
```

### Error Handling

Components implement consistent error handling:

```typescript
if (error) {
  return (
    <ErrorMessage 
      message={error} 
      onRetry={() => {
        setError(null);
        fetchData();
      }} 
    />
  );
}
```

### Loading States

Loading states are handled consistently:

```typescript
if (loading) {
  return (
    <div className="flex items-center justify-center p-8">
      <LoadingSpinner size="lg" />
      <span className="ml-2">Loading...</span>
    </div>
  );
}
```

### Form Validation

Forms use consistent validation patterns:

```typescript
const [errors, setErrors] = useState({});

const validateForm = () => {
  const newErrors = {};
  
  if (!formData.title.trim()) {
    newErrors.title = 'Title is required';
  }
  
  if (!formData.email || !isValidEmail(formData.email)) {
    newErrors.email = 'Valid email is required';
  }
  
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

## Styling Guidelines

### Design System

The application uses a consistent design system with:

- **Colors**: Blue/purple gradient theme with semantic colors
- **Typography**: Clear hierarchy with proper contrast
- **Spacing**: Consistent spacing scale
- **Shadows**: Subtle shadows for depth
- **Borders**: Rounded corners and subtle borders
- **Animations**: Smooth transitions and hover effects

### Glassmorphism

Many components use glassmorphism effects:

```css
.glass-effect {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

### Responsive Design

Components are built with mobile-first responsive design:

```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Responsive grid */}
</div>
```

## Best Practices

1. **Component Composition**: Break down complex components into smaller, reusable pieces
2. **Props Interface**: Always define TypeScript interfaces for component props
3. **Error Boundaries**: Implement error boundaries for better error handling
4. **Accessibility**: Use proper ARIA labels and semantic HTML
5. **Performance**: Use React.memo and useMemo for expensive operations
6. **Testing**: Write unit tests for component logic
7. **Documentation**: Document complex components with JSDoc comments

This documentation covers all the major components in the Jusivo Case Manager application. Each component is designed to be reusable, accessible, and maintainable while following consistent patterns and design principles.