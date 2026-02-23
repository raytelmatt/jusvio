# Jusivo Case Manager - Feature Specification

## Table of Contents
1. [Overview](#overview)
2. [Core Features](#core-features)
3. [User Roles & Authentication](#user-roles--authentication)
4. [Client Management](#client-management)
5. [Matter Management](#matter-management)
6. [Document Management](#document-management)
7. [Billing & Time Tracking](#billing--time-tracking)
8. [Calendar & Scheduling](#calendar--scheduling)
9. [Deadline Management](#deadline-management)
10. [Communications](#communications)
11. [Intake Forms](#intake-forms)
12. [Client Portal](#client-portal)
13. [Dashboard & Analytics](#dashboard--analytics)
14. [Settings & Preferences](#settings--preferences)

---

## Overview

**Jusivo Case Manager** is a comprehensive legal practice management system designed for law firms handling **Criminal Defense**, **Personal Injury**, and **Social Security Disability (SSD)** cases. The application provides end-to-end case management from initial client intake through billing and document generation.

### Technology Stack
- **Frontend**: React 19 with TypeScript, Vite build tool
- **Styling**: Tailwind CSS with custom glassmorphism design
- **Routing**: React Router v7
- **Backend**: Backend abstraction layer (currently implemented with Firebase)
- **Authentication**: Firebase Authentication with Google OAuth and email/password
- **Database**: Firestore NoSQL database
- **Storage**: Cloud storage for documents
- **Icons**: Lucide React
- **Document Generation**: jsPDF and docx libraries
- **Email**: SendGrid integration

### Supported Practice Areas
1. **Criminal Defense** - Criminal charges, court cases, and defense representation
2. **Personal Injury** - Accident and injury claims
3. **Social Security Disability (SSD)** - Disability benefit applications and hearings

---

## Core Features

### Multi-Practice Area Support
- Each matter is assigned to one of three practice areas
- Practice area-specific forms and workflows
- Color-coded visual indicators throughout the UI
- Filterable views by practice area

### Backend Abstraction
- Database operations abstracted through a unified service layer
- Storage operations for file management
- Authentication service for user management
- Supports migration between backend providers

### Real-time Updates
- Live synchronization with backend database
- Automatic data refresh on user actions
- Network status monitoring with offline indicators

---

## User Roles & Authentication

### Authentication Methods
1. **Email/Password Login**
   - Standard email and password authentication
   - Required field validation
   - Error handling for invalid credentials

2. **Google OAuth**
   - Single sign-on with Google accounts
   - Seamless authentication flow

### User Roles
The system supports four user roles:
1. **Admin** - Full system access and user management
2. **Attorney** - Case management, billing, and document access
3. **Staff** - Support functions, limited administrative access
4. **Client** - Portal access to their own matters only

### Session Management
- Persistent user sessions
- Automatic session refresh
- Protected routes requiring authentication
- Automatic redirect to login for unauthenticated access

---

## Client Management

### Client Directory
**Core Features:**
- Searchable and filterable client list
- Search by name, email, or phone number
- Filter by:
  - Contact method (Email, Phone, SMS)
  - Portal status (Enabled/Disabled)
  - Creation date range (Today, This Week, This Month, This Quarter)
  - Contact information availability

**Display Options:**
- Standard list view with client cards
- Billing dashboard view with financial summaries
- Client actions menu for quick operations

**Export Functionality:**
- CSV export of client data
- Includes: name, email, phone, preferred contact method, portal status, creation date

### Client Profile

**Basic Information:**
- Auto-generated client number
- First name and last name (required)
- Date of birth
- SSN (last 4 digits)
- Multiple phone numbers support
- Email address
- Preferred contact method (Email, Phone, SMS)

**Address Information:**
- Street address
- City
- State
- ZIP code

**Emergency Contact:**
- Contact name
- Relationship
- Phone number

**Portal Settings:**
- Enable/disable portal access
- Notification opt-in status

**Client Detail Page:**
- **Overview Tab**: Complete client profile information
- **Matters Tab**: All matters associated with the client
- **Billing Tab**: Financial summary including:
  - Total invoiced amount
  - Total paid amount
  - Current balance due
  - Unbilled time value
  - Matter-specific balances

### Client Actions
- Create new client
- Edit client information
- Delete client (with confirmation)
- Enable/disable client portal access
- Navigate to client's matters
- View billing information

---

## Matter Management

### Matter Types & Statuses

**Matter Statuses:**
- **Intake** - Initial inquiry or consultation phase
- **Open** - Active case in progress
- **Pending** - Awaiting information or action
- **Closed** - Completed or terminated case

**Visual Indicators:**
- Color-coded status badges
- Practice area icons
- Matter number display
- Client association

### Matter List

**Search & Filter:**
- Search by matter title, matter number, or client name
- Filter by practice area (Criminal, Personal Injury, SSD)
- Filter by status (Intake, Open, Pending, Closed)

**Matter Cards Display:**
- Matter title
- Practice area with color coding
- Status badge
- Auto-generated matter number (MT-{timestamp})
- Associated client name
- Opened date
- Fee model indicator
- Description preview (truncated)

### Creating New Matters

**Required Information:**
- Client selection (dropdown of existing clients)
- Matter title
- Practice area selection
- Case description

**Fee Structure Options:**
1. **Flat Rate**
   - Fixed fee for entire matter
   - One-time amount entry
   - No hourly time tracking

2. **Progressive Billing**
   - Hourly rate billing
   - Time tracking enabled
   - Multiple time entries
   - Flexible hourly rates per entry

**Auto-Generation:**
- Matter number: MT-{timestamp}
- Initial status: Open
- Creation timestamp

### Matter Detail Page

**Multi-Tab Interface:**

1. **Overview Tab**
   - Matter information summary
   - Client details
   - Fee model information
   - Status management
   - Edit and delete actions

2. **Documents Tab**
   - List of all documents associated with the matter
   - Document preview capability
   - Upload new documents
   - Generate documents from templates
   - Filter and search documents

3. **Communications Tab**
   - Email history
   - Phone call logs
   - SMS messages
   - Portal messages
   - Communication timeline
   - Create new communications

4. **Timeline Tab**
   - Chronological activity feed
   - All matter-related events
   - Task history
   - Status changes
   - Document uploads
   - Communication records

**Financial Management:**
- Time entries list
- Invoice creation and management
- Payment recording
- Balance tracking

**Task Management:**
- Task checklist
- Add new tasks
- Mark tasks complete
- Task due dates
- Assignment to users

---

## Document Management

### Document Operations

**Upload Documents:**
- Support for multiple file types: PDF, DOC, DOCX, TXT, JPG, PNG
- Maximum file size limits
- Associate with specific matters
- Set document title
- Define status (Draft or Final)
- Automatic metadata extraction
- Cloud storage integration

**Generate Documents:**
- Create documents from predefined templates
- Variable substitution with user input
- Output formats: PDF or DOCX
- Automatic filename generation
- Download generated documents
- Save to matter records

**Document Status:**
- **Draft** - Work in progress, may have changes
- **Final** - Completed and finalized

### Document Templates

**Template Creation:**
- Custom template builder
- 9 predefined categories:
  1. General
  2. Criminal
  3. Personal Injury
  4. SSD (Social Security Disability)
  5. Contracts
  6. Motions
  7. Pleadings
  8. Letters
  9. Forms

**Template Variables:**
- Define placeholders using `{{variable_name}}` syntax
- Dynamic variable replacement during generation
- Support for multiple variables per template
- Variable validation

**Template Management:**
- Browse available templates
- Filter by category
- View variable count per template
- Edit and update templates
- Delete unused templates

### Document Version Control

**Version History:**
- Track multiple versions of documents
- Version numbering (incremental)
- Creation timestamp per version
- Creator tracking
- Changes summary field
- Previous version access

**Version Operations:**
- Create new version from existing document
- View version history
- Restore previous versions
- Download specific versions

### Document Actions

**Available Actions:**
- Preview document content
- Download document file
- Edit metadata (title, status)
- Share via link
- Duplicate document
- Delete document
- Generate new version

### Document Search & Filter

**Search Capabilities:**
- Search by document title
- Search by matter title
- Search by client name
- Full-text search

**Filter Options:**
- Filter by document status (Draft/Final)
- Filter by matter
- Filter templates by category
- Date range filtering

**View Modes:**
- Documents list view
- Templates list view
- Tabbed interface to switch between views

### Document Generation Engine

**Features:**
- Template variable extraction and parsing
- User input collection for variables
- PDF generation with formatting
  - Automatic text wrapping
  - Page break handling
  - Header and footer support
  - Font customization
- DOCX generation with styles
  - Paragraph formatting
  - Section breaks
  - Font and spacing control
- Error handling and validation
- Progress indicators during generation

---

## Billing & Time Tracking

### Time Entry Management

**Time Entry Creation:**
- Select associated matter
- Entry date selection
- Hours worked (decimal format)
- Hourly rate (default: $400/hour, customizable)
- Detailed description of work performed
- Automatic amount calculation (hours × rate)
- Creator tracking

**Time Entry Display:**
- Searchable time entry list
- Filter by matter
- Sort by date
- View unbilled vs. billed entries
- Matter and client information display

### Invoice Management

**Invoice Creation:**
- Select matter for invoicing
- Add line items in two ways:
  1. **From Time Entries**: Select existing unbilled time entries
  2. **Custom Line Items**: Manually create items with description, quantity, and rate
- Apply taxes (percentage-based)
- Apply discounts (percentage-based)
- Set invoice due date
- Add invoice description/notes

**Invoice Features:**
- Auto-generated invoice number
- Status tracking: Draft → Sent → Paid/Overdue
- Automatic total calculation:
  - Line item totals (quantity × rate)
  - Subtotal
  - Tax application
  - Discount application
  - Final total
- Created by tracking
- Timestamp tracking

**Invoice Actions:**
- View invoice details
- Download/print invoice
- Send invoice to client
- Mark as sent
- Record payments
- Edit draft invoices
- Delete invoices
- Change invoice status

**Invoice Filtering:**
- Filter by status (Draft, Sent, Paid, Overdue)
- Filter by matter
- Filter by date range
- Search by invoice number

### Payment Management

**Payment Recording:**
- Associate with invoice (optional)
- Associate with matter
- Payment amount
- Payment method options:
  - Cash
  - Check
  - Credit Card
  - ACH/Bank Transfer
  - Other
- Payment reference/check number
- Payment received date
- Creator tracking
- Timestamp

**Payment Display:**
- Payment history list
- Client and matter information
- Payment method indicators
- Running payment totals
- Link to related invoices

### Billing Dashboard

**Summary Metrics:**
1. **Unbilled Time**
   - Total dollar value of time entries not yet invoiced
   - Visual indicator for pending billing

2. **Outstanding Balance**
   - Sum of all Sent and Overdue invoice amounts
   - Tracks total accounts receivable

3. **Paid This Month**
   - Total payments received in current month
   - Revenue tracking for period

**Tabbed Interface:**
- **Time Entries Tab**: All time entries with matter details
- **Invoices Tab**: All invoices with status and filtering
- **Payments Tab**: Payment history with client and method details

**Search & Export:**
- Search across all billing records
- Export financial reports
- Filter by date ranges
- Matter-specific billing views

### Client Balances

**Balance Summary View:**
For each client, display:
- Total invoiced amount across all matters
- Total paid amount across all matters
- Current balance due (invoiced - paid)
- Unbilled time value
- Combined total due (balance + unbilled)

**Features:**
- Search by client name, email, or client number
- Sort by balance amount
- Alert indicators for outstanding balances
- Quick links to client profiles
- Matter-specific balance breakdown
- CSV export of balance report

**Actions:**
- View client detail page
- Navigate to client billing tab
- Send balance notifications
- Generate statements

---

## Calendar & Scheduling

### Calendar View

**Monthly Calendar Display:**
- Traditional month grid layout
- Navigation controls (previous month, next month, today)
- Current date highlighting
- Event display in calendar cells

**Hearing Display:**
- Up to 2 hearings per day cell
- Overflow indicator ("+ X more") for additional hearings
- Hearing time and type
- Client name
- Color-coded by practice area

**Practice Area Color Coding:**
- Criminal Defense: One color scheme
- Personal Injury: Another color scheme
- SSD: Third color scheme
- Visual consistency with other views

### Upcoming Hearings Panel

**Features:**
- List view below calendar
- Shows next 10 upcoming hearings
- Sorted chronologically by date/time

**Hearing Details:**
- Date and day of week
- Start and end time
- Client name
- Matter title
- Courtroom information
- Judge or ALJ name
- Practice area badge
- Link to matter page

**Filtering:**
- Filter by practice area
- Show/hide specific practice areas
- Toggle criminal, personal injury, or SSD hearings

### Hearing Creation

**New Hearing Form:**
- Matter selection (required)
- Hearing type (required)
- Start date and time (required)
- End date and time (optional)
- Courtroom information (optional)
- Judge/ALJ name (optional)
- Notes field
- SSA hearing checkbox (for SSD cases)

**SSA-Specific Features:**
- Automatic detection of SSD practice area
- Dynamic label change: "Judge" → "ALJ" (Administrative Law Judge)
- Special formatting for SSA hearings

**Validation:**
- Required field checking
- Date/time validation
- Conflict detection (optional)
- Form error display

---

## Deadline Management

### Deadline List View

**Grouped by Urgency:**
Deadlines are organized into urgency tiers with color coding:

1. **Overdue (Red)**
   - Past due date
   - Urgent attention required
   - Visual alert indicators

2. **Due This Week (Orange)**
   - 0-7 days until due
   - High priority
   - Warning indicators

3. **Due This Month (Yellow)**
   - 8-30 days until due
   - Medium priority
   - Caution indicators

4. **Future (Gray)**
   - More than 30 days away
   - Low priority
   - Standard display

5. **Completed (Green)**
   - Marked as complete
   - Checkmark indicators
   - Grayed out display

**Summary Cards:**
- Count of deadlines in each urgency tier
- Visual icons for each tier
- Quick navigation to filtered views

### Deadline Information

**Core Fields:**
- Deadline title
- Associated matter
- Client name
- Practice area
- Due date and time
- Status (Open, Completed, PastDue)

**Deadline Source Types:**
1. **Rule** - Based on procedural rules (e.g., 30 days to respond)
2. **CourtOrder** - Court-ordered deadline
3. **SSA** - Social Security Administration deadline
4. **Manual** - Manually created by user

### Deadline Filtering

**Filter Options:**
- Filter by status (Open, Completed, PastDue)
- Filter by practice area
- Filter by timeframe (overdue, this week, this month, future)
- Filter by assigned user

**Search:**
- Search by deadline title
- Search by matter title
- Search by client name

### Deadline Detail Page

**Information Display:**
Three-part card system:
1. **Due Date Card**
   - Date and time
   - Days until due (or days overdue)
   - Color-coded urgency indicator

2. **Matter Card**
   - Matter title and number
   - Client name
   - Practice area
   - Link to matter page

3. **Status Card**
   - Current status badge
   - Priority indicator
   - Last updated timestamp

**Notes & Updates Section:**
- Add timestamped notes
- Edit notes
- Note creator email display
- Chronological note history
- Rich text formatting

**Email Communications Panel:**
- Display related email communications
- Direction indicators (inbound/outbound)
- Email subject lines
- Email body preview
- Sender/recipient information
- Email timestamps

**Actions:**
- Mark deadline as complete
- Edit deadline information
- Delete deadline
- Add notes
- View related matter
- Send notifications

### Deadline Creation

**New Deadline Form:**
- Matter selection (required) with dropdown
- Deadline title (required)
- Source type selection (required)
- Due date and time (required)
- Responsible users (optional, multi-select)
- Description/notes (optional)

**Matter Preview:**
- Selected matter title
- Matter number
- Practice area badge
- Client name

**Validation:**
- Required field checking
- Future date validation (warnings for past dates)
- Form error messages

### Deadline Notifications

**Automated Notifications:**
- Email notifications for upcoming deadlines
- Configurable reminder timing
- User preference-based notifications
- Practice area-specific notifications

---

## Communications

### Communication Types

**Supported Channels:**
1. **Email** - Email correspondence
2. **Phone** - Phone call logs
3. **SMS** - Text message logs
4. **Portal** - Client portal messages

**Communication Direction:**
- **Inbound** - Communications received from clients
- **Outbound** - Communications sent to clients

### Communication List

**Display Features:**
- Chronological timeline view
- Communication type icons
- Direction indicators (arrows)
- Sender/recipient information
- Timestamp display
- Subject line (for emails)
- Body preview
- Matter association
- Client information

**Search & Filter:**
- Search by text content
- Filter by channel type
- Filter by direction (inbound/outbound)
- Filter by matter
- Filter by client
- Date range filtering

### Communication Detail View

**Modal Display:**
- Full communication content
- From and to addresses
- Subject line (emails)
- Complete message body
- Associated matter details
- Client information
- Timestamp
- Communication type badge

**Available Actions:**
- View full details
- Star/flag important communications
- Reply (for emails)
- Forward (for emails)
- Delete communication

### Create Communication

**Manual Communication Logging:**
- Select matter (required)
- Select communication type (required)
- Select direction (inbound/outbound)
- Subject line (for emails)
- Message body (required)
- Timestamp (auto-filled, editable)

**Email-Specific Fields:**
- From email address
- To email address
- CC addresses
- BCC addresses

**Validation:**
- Required field checking
- Email format validation
- Matter association required
- Character limits

### Email Service Integration

**Automated Email Notifications:**
- Deadline reminder emails
- Hearing notification emails
- Custom HTML email templates
- Plain text fallback templates

**Email Threading:**
- Custom message IDs for conversation threading
- In-Reply-To headers for proper threading
- References headers for email clients

**Reply Tracking:**
- Custom reply-to addresses with encoded metadata
- Automatic extraction of matter/deadline/hearing context
- Link replies back to original records
- Parse incoming email headers

**Recipient Management:**
- Filter recipients based on notification preferences
- Respect user notification settings
- Handle notification opt-in/opt-out

**Integration Features:**
- SendGrid API integration
- Click tracking
- Open tracking
- Bounce handling
- Delivery status

---

## Intake Forms

### General Intake Form

**Multi-Step Process:**
Four-step form with validation at each stage:

**Step 1: Personal Information**
- First name (required)
- Last name (required)
- Date of birth
- Phone number
- Email address

**Step 2: Contact & Address**
- Street address
- City
- State
- ZIP code
- Emergency contact name
- Emergency contact relationship
- Emergency contact phone

**Step 3: Case Details**
- Practice area selection (required)
- Case description (required)
- Incident date
- Urgency level selection

**Practice Area-Specific Fields:**

*For Criminal Cases:*
- Criminal charges
- Arrest information

*For Personal Injury Cases:*
- Injury type
- Injury description
- Insurance information
- At-fault party information

*For SSD Cases:*
- Disability type
- Disability description
- Work history
- Previous applications

**Step 4: Review & Submit**
- Summary of all entered information
- Confirmation checkboxes
- Submit button
- Form validation

**Form Features:**
- Progress indicator
- Previous/Next navigation
- Field validation with error messages
- Auto-save draft capability
- Required field indicators

### Criminal Intake Form

**Comprehensive Criminal-Specific Form:**

**Personal Information (Enhanced):**
- Full name
- SSN (last 4 digits)
- Date of birth
- Gender
- Race/ethnicity
- Citizenship status
- Multiple phone numbers (cell, home, work)
- Email
- Current address
- Mailing address (if different)

**Criminal Case Details:**
- Charges (multiple)
- Charge type (Felony/Misdemeanor)
- Arrest date
- Arrest county
- Case number
- Court information
- Bond terms and amount
- Jail release date
- Current custody status

**Background Information:**
- Prior arrests count
- Prior convictions
- Probation status
- Parole status
- Driver's license status
- Outstanding warrants

**Employment & Financial:**
- Current employer
- Employer contact information
- Job title
- Monthly income
- Financial hardship status

**Incident Details:**
- Incident description
- Incident location
- Date and time of incident
- Witnesses (names and contacts)
- Police report number
- Investigating officer

**Health Information:**
- Medical conditions
- Current medications
- Mental health treatment history
- Substance abuse history
- Treatment programs

**Validation:**
- Multi-step form validation
- Required field enforcement
- Format validation (phone, email, SSN)
- Conditional field display

### Intake Administration

**Admin Review Dashboard:**
Access at `/intakes` (protected route for staff/attorneys)

**Intake List Display:**
- Submission date and time
- Applicant name
- Contact information (email, phone)
- Practice area
- Intake type (General or Criminal)
- Current status badge
- Preview of case description

**Status Workflow:**
Three-stage process:
1. **New** - Just submitted, not yet reviewed
2. **Reviewed** - Staff has reviewed the intake
3. **Converted** - Intake converted to client and matter

**Filtering Options:**
- Filter by intake type
- Filter by practice area
- Filter by status (New/Reviewed/Converted)
- Search by name, email, or description keywords
- Date range filtering

**Intake Actions:**
1. **View Details** - Display full intake information
2. **Mark as Reviewed** - Change status to reviewed
3. **Convert to Client + Matter** - Automatic conversion that:
   - Creates new client record with intake information
   - Creates new matter associated with the client
   - Updates intake status to "Converted"
   - Links intake to created client/matter
4. **Delete Intake** - Remove spam or duplicate submissions

**Data Limits:**
- Load up to 1,000 intakes per query
- Paginated display
- Sorted by submission date (newest first)

---

## Client Portal

### Portal Authentication

**Client Portal Login Page:**
Public-facing page at `/client-portal`

**Three Authentication Methods:**
1. **Email Lookup**
   - Enter email address
   - System searches for matching client
   - Direct portal access on match

2. **Phone Lookup**
   - Enter phone number
   - System searches client records
   - Access granted on match

3. **Name Lookup**
   - Enter first and last name
   - System searches for matches
   - Access granted on unique match

**Security Features:**
- No password required (lookup-based authentication)
- Client must be in system database
- Portal must be enabled for client
- Session management
- Automatic timeout

**UI Design:**
- Gradient background
- Glassmorphism card design
- Modern, professional appearance
- Mobile-responsive
- Support contact information display

### Client Portal Dashboard

**Dashboard URL:**
`/client-portal/:clientId` (authenticated access only)

**Dashboard Summary:**
Quick statistics cards displaying:
- Count of active cases/matters
- Number of available documents
- Unread message count
- Upcoming hearings count

**Six Content Tabs:**

### 1. Overview Tab
**Upcoming Court Dates:**
- Next 5 upcoming hearings
- Date and time
- Hearing type
- Courtroom
- Judge/ALJ name
- Link to case details

**Recent Activity:**
- Timeline of recent case activities
- Document uploads
- Status changes
- Communications
- Payment records
- Chronological display with timestamps

**Quick Actions:**
- Message attorney button
- Upload document button
- View billing button
- Schedule appointment button

### 2. My Cases Tab
**Case List:**
Display all matters for the client with:
- Matter title
- Case/matter number
- Practice area
- Current status
- Assigned attorney
- Opened date
- Case description

**Case Details:**
Click to expand:
- Full case information
- Current status
- Next steps
- Important dates
- Fee model (if applicable)
- Billing summary

**Status Indicators:**
- Color-coded status badges
- Practice area icons
- Progress indicators

### 3. Documents Tab
**Document Access:**
- List of all documents for client's matters
- Document titles
- Associated case
- Upload date
- Document type/category
- File size

**Document Actions:**
- View document (in-browser preview when possible)
- Download document
- Print document
- Request document explanation

**Document Upload:**
- Client can upload documents
- Select associated case
- Add document title
- Upload file
- Submit for attorney review

**Filtering:**
- Filter by case/matter
- Filter by document type
- Sort by date
- Search by title

### 4. Messages Tab
**Message Thread Display:**
- Conversation view with attorney/staff
- Message history
- Sender identification
- Timestamps
- Unread message indicators

**Compose Messages:**
- New message button
- Select recipient (attorney/staff)
- Subject line
- Message body
- Attach documents
- Send message

**Message Features:**
- Read/unread status
- Reply to messages
- Message threading
- Notification of new messages
- Search message history

### 5. Billing Tab
**Financial Summary:**
- Total amount invoiced
- Total amount paid
- Current balance due
- Payment history

**Invoice List:**
- Invoice number
- Issue date
- Due date
- Amount
- Status (Unpaid/Paid/Overdue)
- View invoice detail button

**Invoice Detail View:**
- Line items breakdown
- Subtotal
- Taxes and discounts
- Total amount
- Payment instructions
- Download/print invoice
- Payment history for invoice

**Payment Actions:**
- Make payment button
- View payment options
- Payment history
- Receipt download

**Unbilled Time:**
- Display of recent time entries not yet invoiced
- Description of work
- Hours and rates
- Attorney who performed work

### 6. Settings Tab
**Client Preferences:**
- Contact information display
- Preferred contact method
- Update email address
- Update phone number
- Update mailing address

**Notification Settings:**
- Email notifications toggle
- SMS notifications toggle
- Portal message notifications
- Hearing reminders
- Deadline notifications
- Billing notifications

**Account Security:**
- Change portal password (if password auth enabled)
- Security questions
- Trusted devices
- Login history

**Communication Preferences:**
- Language preference
- Document delivery method
- Appointment reminders
- Newsletter subscription

---

## Dashboard & Analytics

### Main Dashboard

**Welcome Section:**
- Personalized greeting with user name
- Current date and time
- Quick action buttons:
  - New Client
  - New Matter
  - New Time Entry
  - Upload Document

### Key Statistics Cards

**Visual Metric Cards:**
Glassmorphism design with icons and trend indicators

1. **Clients Card**
   - Total active clients count
   - Icon: Users
   - Color: Blue
   - Link to Clients page
   - Optional: Growth trend percentage

2. **Open Matters Card**
   - Count of open matters
   - Icon: Folder
   - Color: Purple
   - Link to Matters page
   - Optional: Breakdown by practice area

3. **Upcoming Hearings Card**
   - Count of hearings in next 30 days
   - Icon: Calendar
   - Color: Orange
   - Link to Calendar page
   - Optional: Next hearing date

4. **Deadlines Card**
   - Count of upcoming deadlines
   - Icon: Clock
   - Color: Red
   - Link to Deadlines page
   - Breakdown: 7 days / 30 days

5. **Unpaid Invoices Card**
   - Count of unpaid invoices
   - Icon: DollarSign
   - Color: Green
   - Link to Billing page
   - Optional: Total outstanding amount

6. **Portal Messages Card**
   - Count of new/unread portal messages
   - Icon: Mail
   - Color: Blue
   - Link to Communications page
   - Optional: Recent message preview

### Open Matters Breakdown

**Practice Area Summary:**
Visual breakdown showing:
- Criminal Defense matter count
- Personal Injury matter count
- SSD matter count
- Total open matters
- Chart or graph visualization
- Color-coded segments
- Clickable to filter by practice area

### Recent Activity Feed

**Activity Timeline:**
Chronological list of recent actions:
- New clients added
- New matters created
- Documents uploaded
- Invoices generated
- Payments received
- Deadlines created
- Hearings scheduled
- Status changes

**Activity Items Display:**
- Action icon
- Description text
- User who performed action
- Timestamp (relative: "2 hours ago")
- Link to related record

### Upcoming Items

**Hearings Widget:**
- Next 5 upcoming hearings
- Date and time
- Client name
- Case title
- Hearing type
- Courtroom

**Deadlines Widget:**
- Next 5 upcoming deadlines
- Due date with days remaining
- Deadline title
- Associated matter
- Client name
- Urgency color coding

**Tasks Widget:**
- Overdue tasks highlighted
- Today's tasks
- This week's tasks
- Task title
- Assigned to user
- Due date
- Status

### Quick Actions Panel

**Shortcut Buttons:**
- Add Client
- Create Matter
- Log Time
- Create Invoice
- Upload Document
- Schedule Hearing
- Add Deadline
- Send Message

**Navigation Shortcuts:**
- Go to Billing
- Go to Documents
- Go to Calendar
- Go to Reports

### Financial Overview

**Summary Cards:**
- Total revenue (current month)
- Outstanding balance
- Unbilled time value
- Collection rate

**Charts:**
- Revenue trend (last 6 months)
- Practice area revenue breakdown
- Payment method distribution

---

## Settings & Preferences

### User Profile Management

**Profile Information:**
- First name (required)
- Last name (required)
- Email address (read-only, from auth)
- Phone number
- Role (Admin/Attorney/Staff/Client)
- Bar number (for attorneys)
- Practice areas (multi-select)

**Attorney-Specific:**
- Bar admission number
- Practice areas of focus
- Default hourly rate
- Professional bio

### User Management (Admin Only)

**User List:**
- All system users
- Search by name or email
- Filter by role
- Filter by active status
- Sort by creation date

**User Actions:**
- Create new user
- Edit user profile
- Deactivate/activate user
- Delete user
- Reset password
- Change user role

**New User Form:**
- Email (required)
- First and last name
- Assign role
- Set initial password
- Send invitation email
- Set practice areas
- Set permissions

### Notification Preferences

**Email Notifications:**
- New deadline notifications (on/off)
- Hearing reminders (on/off)
- New portal messages (on/off)
- Invoice sent/paid notifications
- Document uploaded notifications
- Matter status changes
- Client communications

**Desktop Notifications:**
- Browser notifications (on/off)
- Sound alerts (on/off)
- Notification display duration

**SMS Notifications:**
- Urgent deadline alerts (on/off)
- Hearing reminders (on/off)
- Court date changes (on/off)

**Notification Timing:**
- Deadline reminder timing (days before)
- Hearing reminder timing (days before)
- Daily digest time
- Weekly summary day

### Appearance Settings

**Theme Options:**
- Light theme
- Dark theme
- System preference (auto)

**Layout Preferences:**
- Sidebar collapsed by default (on/off)
- Layout density:
  - Compact - More information per screen
  - Comfortable - Balanced spacing
  - Spacious - More whitespace

**Display Options:**
- Show/hide avatars
- Card style vs. list style
- Date format preference
- Time format (12/24 hour)
- Currency format

### Practice Settings

**Default Values:**
- Default practice area (for new matters)
- Auto-generate matter numbers (on/off)
- Matter number format
- Default hourly rate ($400 default)
- Require time entry descriptions (on/off)
- Default invoice due days (30 default)

**Billing Preferences:**
- Default tax rate (percentage)
- Standard payment terms text
- Invoice footer text
- Late fee policies
- Payment methods accepted

**Document Preferences:**
- Default document status (Draft/Final)
- Auto-version on edit (on/off)
- Default template category
- Document retention policy

### Firm Information (Admin Only)

**Firm Details:**
- Firm name
- Address
- Phone
- Email
- Website
- Tax ID number
- Bar association membership

**Branding:**
- Firm logo upload
- Color scheme selection
- Email template branding
- Invoice header customization

### Data & Privacy

**Data Export:**
- Export all client data
- Export matters data
- Export billing data
- Export documents metadata
- CSV or JSON format options

**Data Retention:**
- Closed matter retention period
- Document retention policy
- Communication log retention
- Automatic data archiving

**Privacy Settings:**
- Client data access logging
- Audit trail enabled
- GDPR compliance features
- Data deletion requests

### Integration Settings

**Email Integration:**
- SendGrid API key configuration
- Email signature
- Reply-to address
- Email templates

**Calendar Integration:**
- Google Calendar sync (optional)
- Outlook Calendar sync (optional)
- iCal export options

**Backup & Recovery:**
- Automatic backup schedule
- Backup retention period
- Restore from backup option
- Export all data

---

## Technical Features

### Data Validation
- Zod schema validation throughout application
- Type-safe data transformations
- Client-side form validation
- Server-side data validation
- Error message localization

### Error Handling
- Comprehensive error catching
- User-friendly error messages
- Error logging and tracking
- Graceful degradation
- Offline error handling

### Performance Optimization
- Lazy loading of routes
- Code splitting
- Image optimization
- Caching strategies
- Debounced search inputs
- Virtual scrolling for large lists

### Security Features
- Protected routes with authentication
- Role-based access control
- Input sanitization
- XSS prevention
- CSRF protection
- Secure file uploads
- Data encryption at rest and in transit

### Responsive Design
- Mobile-first approach
- Tablet optimization
- Desktop layouts
- Touch-friendly interfaces
- Responsive navigation
- Adaptive component sizing

### Accessibility
- ARIA labels
- Keyboard navigation
- Screen reader support
- High contrast mode
- Focus indicators
- Alt text for images

### Testing
- 82 unit tests
- 111 E2E tests
- Business logic coverage (~90%)
- Component testing
- Integration testing
- Continuous integration

---

## Future Enhancement Opportunities

While this specification covers the current implemented features, the architecture supports expansion in areas such as:

- Advanced reporting and analytics
- Client communication portal enhancements
- Mobile native applications
- Third-party integrations (court systems, document signing)
- AI-powered document analysis
- Automated deadline calculation from rules
- Multi-language support
- Advanced calendaring with conflict detection
- Team collaboration features
- Video conferencing integration

---

## Conclusion

Jusivo Case Manager is a comprehensive legal practice management system designed specifically for law firms handling Criminal Defense, Personal Injury, and Social Security Disability cases. The application provides complete workflow management from initial client intake through document generation, billing, and client portal access. With its modern technology stack, intuitive user interface, and robust feature set, it streamlines law firm operations and improves client service delivery.
