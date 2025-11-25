# Jusivo Case Manager - Usage Guide

## Overview

This guide provides comprehensive instructions for using the Jusivo Case Manager application, including common workflows, best practices, and troubleshooting tips.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication](#authentication)
3. [Dashboard Overview](#dashboard-overview)
4. [Client Management](#client-management)
5. [Matter Management](#matter-management)
6. [Document Management](#document-management)
7. [Billing and Invoicing](#billing-and-invoicing)
8. [Task Management](#task-management)
9. [Communication Tracking](#communication-tracking)
10. [Calendar and Deadlines](#calendar-and-deadlines)
11. [Notifications](#notifications)
12. [Settings and Configuration](#settings-and-configuration)
13. [Best Practices](#best-practices)
14. [Troubleshooting](#troubleshooting)

## Getting Started

### Initial Setup

1. **Access the Application**
   - Navigate to your Jusivo Case Manager URL
   - You'll be redirected to the login page if not authenticated

2. **First Login**
   - Click "Login with Google" for OAuth authentication
   - Or use email/password if configured
   - Complete any required profile setup

3. **Dashboard Tour**
   - Familiarize yourself with the sidebar navigation
   - Review the dashboard statistics
   - Explore the quick action buttons

### Navigation Overview

The application uses a fixed sidebar navigation with the following main sections:

- **Dashboard**: Overview and statistics
- **Clients**: Client management
- **Matters**: Case management
- **Calendar**: Scheduling and events
- **Deadlines**: Important dates and deadlines
- **Documents**: File management
- **Communications**: Message tracking
- **Billing**: Financial management
- **Settings**: Configuration

## Authentication

### Login Process

1. **Google OAuth Login**
   ```
   1. Click "Login with Google"
   2. Complete Google authentication
   3. Grant necessary permissions
   4. Redirected back to application
   ```

2. **Email/Password Login**
   ```
   1. Enter email address
   2. Enter password
   3. Click "Sign In"
   4. Access granted if credentials are valid
   ```

### Session Management

- Sessions are automatically managed by Firebase
- Users remain logged in across browser sessions
- Automatic logout after extended inactivity
- Manual logout available in user menu

### User Roles

The system supports different user roles:

- **Admin**: Full system access
- **Attorney**: Case management and client access
- **Staff**: Limited administrative access
- **Client**: Portal access only

## Dashboard Overview

### Key Statistics

The dashboard displays important metrics:

1. **Practice Area Breakdown**
   - Criminal cases count
   - Personal injury cases count
   - SSD cases count
   - Trend indicators

2. **Upcoming Events**
   - Hearings in the next 7 days
   - Deadlines due this week
   - Deadlines due this month

3. **Financial Overview**
   - Unpaid invoices count
   - Outstanding balances

### Quick Actions

The dashboard provides quick access to common tasks:

- **New Client**: Create a new client record
- **New Matter**: Start a new case
- **New Intake**: Begin client intake process
- **Criminal Intake**: Specialized criminal case intake
- **Generate Document**: Create documents from templates
- **Create Invoice**: Generate billing documents
- **Add Deadline**: Set important dates

### Recent Activity

The dashboard shows recent system activity:

- New client intakes
- Document creation
- Deadline notifications
- Payment recordings
- Task completions

## Client Management

### Creating a New Client

1. **Access Client Creation**
   - Click "Clients" in sidebar
   - Click "New Client" button
   - Or use "New Client" from dashboard

2. **Fill Client Information**
   ```
   Required Fields:
   - First Name
   - Last Name
   
   Optional Fields:
   - Email Address
   - Phone Number
   - Date of Birth
   - Address
   - Emergency Contact
   - Preferred Contact Method
   ```

3. **Configure Settings**
   - Enable/disable notifications
   - Enable/disable client portal access
   - Set communication preferences

4. **Save Client**
   - Click "Create Client"
   - Client is assigned a unique client number
   - Redirected to client detail page

### Managing Client Information

1. **View Client Details**
   - Click on client name in client list
   - View all client information
   - See associated matters
   - Review communication history

2. **Edit Client Information**
   - Click "Edit" button on client detail page
   - Modify any client information
   - Save changes

3. **Client Actions**
   - **View Matters**: See all cases for this client
   - **Send Message**: Initiate communication
   - **Toggle Portal**: Enable/disable client portal access
   - **Delete Client**: Remove client (with confirmation)

### Client Portal

1. **Enable Portal Access**
   - Edit client information
   - Check "Portal Enabled" option
   - Save changes

2. **Portal Features**
   - Document access
   - Message communication
   - Case status updates
   - Payment information

## Matter Management

### Creating a New Matter

1. **Access Matter Creation**
   - Click "Matters" in sidebar
   - Click "New Matter" button
   - Or use "New Matter" from dashboard

2. **Select Client**
   - Choose from existing clients
   - Or create new client first

3. **Matter Details**
   ```
   Required Fields:
   - Matter Title
   - Practice Area (Criminal, Personal Injury, SSD)
   - Fee Model (Flat Rate, Progressive)
   
   Optional Fields:
   - Description
   - Flat Rate Amount (if applicable)
   ```

4. **Save Matter**
   - Click "Create Matter"
   - Matter is assigned a unique matter number
   - Redirected to matter detail page

### Matter Detail Page

The matter detail page provides comprehensive case management:

#### Overview Tab
- Basic matter information
- Client details
- Case-specific information (for criminal cases)
- Status and billing information

#### Timeline Tab
- Chronological view of all matter events
- Time entries
- Document creation
- Invoice generation
- Hearings and deadlines
- Communications

#### Documents Tab
- File management
- Document preview
- Version control
- Template-based generation

#### Billing Tab
- Time entry management
- Invoice generation
- Payment tracking
- Financial summaries

#### Communications Tab
- Email tracking
- Phone call logs
- Message history
- Client communications

#### Tasks Tab
- Task creation and management
- Assignment and due dates
- Status tracking
- Progress monitoring

#### Settings Tab
- Court information
- Hearing scheduling
- Case-specific settings

### Matter Status Management

Matters progress through different statuses:

1. **Intake**: Initial case setup
2. **Open**: Active case management
3. **Pending**: Waiting for external action
4. **Closed**: Case completed

### Practice Area Specific Features

#### Criminal Cases
- Case number tracking
- Charge information
- Disposition tracking
- Jurisdiction details
- Arrest date recording

#### Personal Injury Cases
- Incident details
- Medical information
- Insurance tracking
- Settlement management

#### SSD Cases
- Application tracking
- Medical evidence
- Hearing scheduling
- ALJ information

## Document Management

### Uploading Documents

1. **Access Document Upload**
   - Navigate to matter detail page
   - Click "Documents" tab
   - Click "Upload Document" button

2. **File Selection**
   - Drag and drop files
   - Or click to browse
   - Supported formats: PDF, DOC, DOCX, TXT, JPG, PNG

3. **Document Information**
   - Enter document title
   - Select document type
   - Add description (optional)

4. **Upload Process**
   - File is uploaded to secure storage
   - Document record is created
   - Version tracking begins

### Document Templates

1. **Creating Templates**
   - Navigate to Documents page
   - Click "Templates" section
   - Click "New Template"

2. **Template Configuration**
   - Enter template name
   - Define template content
   - Specify variables (e.g., {{client_name}})
   - Set output format (PDF, DOCX)

3. **Using Templates**
   - Select template from list
   - Fill in variable values
   - Generate document
   - Download or save to matter

### Document Preview

1. **Viewing Documents**
   - Click on document name
   - Preview opens in modal
   - Supports PDF, images, and text files

2. **Preview Features**
   - Zoom in/out
   - Rotate document
   - Download original
   - Open in new tab

### Document Versioning

- Each document edit creates a new version
- Version history is maintained
- Previous versions remain accessible
- Version comparison available

## Billing and Invoicing

### Time Entry Management

1. **Recording Time**
   - Navigate to matter detail page
   - Click "Billing" tab
   - Click "Add Time Entry"

2. **Time Entry Details**
   ```
   Required Fields:
   - Description of work performed
   - Hours worked
   - Hourly rate
   - Date of work
   ```

3. **Time Entry Features**
   - Automatic calculation of amounts
   - Rate card integration
   - Bulk time entry import
   - Time entry templates

### Invoice Generation

1. **Creating Invoices**
   - Navigate to matter billing tab
   - Click "Generate Invoice"
   - Select time entries to include

2. **Invoice Configuration**
   ```
   Invoice Details:
   - Issue date
   - Due date
   - Line items (from time entries or custom)
   - Tax rate (if applicable)
   - Discount rate (if applicable)
   ```

3. **Line Item Management**
   - Add time entries automatically
   - Create custom line items
   - Edit quantities and rates
   - Remove unwanted items

4. **Invoice Processing**
   - Review totals
   - Generate invoice
   - Send to client
   - Track payment status

### Payment Tracking

1. **Recording Payments**
   - Click "Record Payment" on invoice
   - Enter payment details:
     - Amount paid
     - Payment method
     - Reference number
     - Date received

2. **Payment Methods**
   - Credit Card
   - Bank Transfer (ACH)
   - Check
   - Cash
   - Other

3. **Payment Processing**
   - Automatic invoice status updates
   - Balance calculations
   - Payment history tracking
   - Receipt generation

### Financial Reporting

1. **Client Balances**
   - Navigate to "Client Balances" page
   - View outstanding amounts
   - Review payment history
   - Generate balance reports

2. **Invoice Management**
   - Track invoice status
   - Monitor overdue payments
   - Generate aging reports
   - Send payment reminders

## Task Management

### Creating Tasks

1. **Task Creation**
   - Navigate to matter detail page
   - Click "Tasks" tab
   - Click "Add New Task"

2. **Task Details**
   ```
   Required Fields:
   - Task title
   
   Optional Fields:
   - Description
   - Due date
   - Status (Open, In Progress, Completed)
   ```

3. **Task Assignment**
   - Assign to specific users
   - Set priority levels
   - Add task categories

### Task Management

1. **Task Status Updates**
   - Click status badge to change
   - Available statuses: Open, In Progress, Completed
   - Automatic timestamp updates

2. **Task Editing**
   - Click "Edit" button
   - Modify task details
   - Update due dates
   - Change assignments

3. **Task Completion**
   - Mark tasks as completed
   - Add completion notes
   - Archive completed tasks

### Task Organization

1. **Filtering and Sorting**
   - Filter by status
   - Sort by due date
   - Group by assignee
   - Search task content

2. **Bulk Operations**
   - Select multiple tasks
   - Bulk status updates
   - Bulk assignment changes
   - Bulk deletion

## Communication Tracking

### Email Management

1. **Email Integration**
   - Automatic email capture
   - Thread tracking
   - Attachment handling
   - Reply management

2. **Email Templates**
   - Create standard templates
   - Variable substitution
   - Brand consistency
   - Quick sending

### Phone Call Logging

1. **Call Recording**
   - Log incoming/outgoing calls
   - Record call duration
   - Add call notes
   - Link to matters

2. **Call History**
   - View call timeline
   - Search call records
   - Export call logs
   - Integration with calendar

### Message Management

1. **Client Portal Messages**
   - Secure messaging
   - File attachments
   - Read receipts
   - Message threading

2. **Internal Communications**
   - Team messaging
   - Matter discussions
   - Note sharing
   - Collaboration tools

## Calendar and Deadlines

### Calendar Management

1. **Calendar Views**
   - Monthly view
   - Weekly view
   - Daily view
   - Agenda view

2. **Event Types**
   - Hearings
   - Deadlines
   - Client meetings
   - Court appearances
   - Internal meetings

### Deadline Management

1. **Creating Deadlines**
   - Navigate to "Deadlines" page
   - Click "New Deadline"
   - Set deadline details

2. **Deadline Types**
   - Court-imposed deadlines
   - Rule-based deadlines
   - SSA deadlines
   - Manual deadlines

3. **Deadline Tracking**
   - Status monitoring
   - Priority levels
   - Notification settings
   - Completion tracking

### Hearing Scheduling

1. **Hearing Creation**
   - Navigate to matter detail
   - Click "Settings" tab
   - Click "New Hearing"

2. **Hearing Details**
   ```
   Required Information:
   - Hearing type
   - Date and time
   - Court information
   
   Optional Information:
   - Courtroom
   - Judge/ALJ
   - Notes
   ```

3. **Hearing Management**
   - Reschedule hearings
   - Add hearing notes
   - Link to deadlines
   - Send notifications

## Notifications

### Notification Types

1. **Deadline Notifications**
   - Upcoming deadlines
   - Overdue deadlines
   - Deadline completions

2. **Hearing Notifications**
   - Hearing reminders
   - Schedule changes
   - Preparation reminders

3. **Payment Notifications**
   - Payment received
   - Overdue invoices
   - Payment failures

4. **Document Notifications**
   - Document uploads
   - Document approvals
   - Version updates

5. **System Notifications**
   - System updates
   - Maintenance notices
   - Security alerts

### Notification Management

1. **Notification Panel**
   - Click bell icon in header
   - View all notifications
   - Filter by type
   - Mark as read/unread

2. **Notification Settings**
   - Configure notification preferences
   - Set notification channels
   - Manage frequency
   - Customize alerts

3. **Email Notifications**
   - Automatic email alerts
   - Customizable templates
   - Delivery preferences
   - Unsubscribe options

## Settings and Configuration

### User Profile

1. **Profile Management**
   - Update personal information
   - Change password
   - Upload profile picture
   - Set preferences

2. **Role and Permissions**
   - View assigned role
   - Understand permissions
   - Request access changes
   - Security settings

### System Settings

1. **General Configuration**
   - System preferences
   - Default settings
   - Integration options
   - Backup settings

2. **Notification Preferences**
   - Email settings
   - SMS preferences
   - Push notifications
   - Quiet hours

3. **Security Settings**
   - Two-factor authentication
   - Session management
   - Password policies
   - Access logs

### Integration Settings

1. **Email Integration**
   - SMTP configuration
   - Email templates
   - Signature management
   - Auto-reply settings

2. **Calendar Integration**
   - Calendar sync
   - Event management
   - Reminder settings
   - Time zone configuration

3. **Document Integration**
   - Cloud storage
   - Template management
   - Version control
   - Backup options

## Best Practices

### Data Management

1. **Regular Backups**
   - Enable automatic backups
   - Test backup restoration
   - Store backups securely
   - Document backup procedures

2. **Data Organization**
   - Use consistent naming conventions
   - Organize documents logically
   - Maintain clean client records
   - Regular data cleanup

3. **Security Practices**
   - Use strong passwords
   - Enable two-factor authentication
   - Regular security updates
   - Monitor access logs

### Workflow Optimization

1. **Template Usage**
   - Create document templates
   - Use email templates
   - Standardize procedures
   - Automate repetitive tasks

2. **Task Management**
   - Set realistic deadlines
   - Prioritize tasks effectively
   - Use task dependencies
   - Regular progress reviews

3. **Communication**
   - Document all communications
   - Use consistent messaging
   - Maintain professional tone
   - Follow up promptly

### Performance Tips

1. **System Performance**
   - Regular browser updates
   - Clear browser cache
   - Use supported browsers
   - Optimize file sizes

2. **Efficiency Tips**
   - Use keyboard shortcuts
   - Leverage bulk operations
   - Set up notifications
   - Use search effectively

## Troubleshooting

### Common Issues

1. **Login Problems**
   ```
   Issue: Cannot log in with Google
   Solution: 
   - Clear browser cache
   - Check internet connection
   - Try incognito mode
   - Contact administrator
   ```

2. **File Upload Issues**
   ```
   Issue: Files not uploading
   Solution:
   - Check file size limits
   - Verify file format
   - Check internet connection
   - Try different browser
   ```

3. **Performance Issues**
   ```
   Issue: Slow loading
   Solution:
   - Clear browser cache
   - Close unnecessary tabs
   - Check internet speed
   - Update browser
   ```

4. **Notification Problems**
   ```
   Issue: Not receiving notifications
   Solution:
   - Check notification settings
   - Verify email address
   - Check spam folder
   - Update preferences
   ```

### Error Messages

1. **Permission Errors**
   - Check user role and permissions
   - Contact administrator
   - Verify matter access
   - Review security settings

2. **Data Validation Errors**
   - Check required fields
   - Verify data format
   - Review input constraints
   - Try different values

3. **Network Errors**
   - Check internet connection
   - Try refreshing page
   - Clear browser cache
   - Contact support

### Getting Help

1. **Documentation**
   - Review this usage guide
   - Check API documentation
   - Read component documentation
   - Search knowledge base

2. **Support Channels**
   - Contact system administrator
   - Submit support ticket
   - Check system status
   - Review error logs

3. **Training Resources**
   - Attend training sessions
   - Watch tutorial videos
   - Read best practices
   - Join user community

### System Requirements

1. **Browser Compatibility**
   - Chrome (recommended)
   - Firefox
   - Safari
   - Edge

2. **System Requirements**
   - Modern operating system
   - Stable internet connection
   - JavaScript enabled
   - Cookies enabled

3. **Mobile Access**
   - Responsive design
   - Mobile-optimized interface
   - Touch-friendly controls
   - Offline capabilities (limited)

This usage guide provides comprehensive instructions for using the Jusivo Case Manager application effectively. For additional support or specific questions, please contact your system administrator or refer to the technical documentation.