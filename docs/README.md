# Jusivo Case Manager - Complete Documentation

## Overview

Jusivo Case Manager is a comprehensive legal case management system built with modern web technologies. This documentation provides complete information about the system's architecture, APIs, components, and usage.

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Documentation Structure](#documentation-structure)
5. [Quick Start](#quick-start)
6. [Development Guide](#development-guide)
7. [Deployment](#deployment)
8. [Contributing](#contributing)
9. [Support](#support)

## System Overview

Jusivo Case Manager is designed to streamline legal practice management with features including:

- **Client Management**: Comprehensive client information and relationship tracking
- **Matter Management**: Complete case lifecycle management
- **Document Management**: Secure document storage, versioning, and template-based generation
- **Billing & Invoicing**: Time tracking, invoice generation, and payment processing
- **Task Management**: Task creation, assignment, and progress tracking
- **Communication Tracking**: Email, phone, and message logging
- **Calendar & Deadlines**: Scheduling, deadline management, and notifications
- **Reporting**: Financial reports, client balances, and case statistics

### Key Features

- **Multi-practice Support**: Criminal, Personal Injury, and SSD cases
- **Role-based Access**: Admin, Attorney, Staff, and Client roles
- **Client Portal**: Secure client access to case information
- **Document Generation**: Template-based document creation (PDF/DOCX)
- **Email Integration**: Automated notifications and communication tracking
- **Mobile Responsive**: Works on desktop, tablet, and mobile devices
- **Real-time Updates**: Live notifications and data synchronization

## Architecture

### Frontend Architecture

The application is built with React 19 and TypeScript, following modern component-based architecture:

```
src/
├── react-app/
│   ├── components/          # Reusable UI components
│   ├── pages/              # Page components
│   ├── auth/               # Authentication components
│   ├── lib/                # Utility libraries and services
│   └── main.tsx           # Application entry point
├── shared/                 # Shared utilities and services
└── types/                  # TypeScript type definitions
```

### Backend Architecture

The system uses Firebase as the backend service provider with a modular adapter pattern:

```
src/react-app/lib/backend/
├── index.ts               # Main backend service exports
├── types.ts              # Backend service interfaces
└── firebase-adapter.ts   # Firebase implementation
```

### Data Flow

1. **Authentication**: Firebase Auth with Google OAuth
2. **Database**: Firestore for document storage
3. **File Storage**: Firebase Storage for document files
4. **Real-time Updates**: Firestore real-time listeners
5. **Email**: SendGrid integration for notifications

## Technology Stack

### Frontend
- **React 19**: Modern React with latest features
- **TypeScript**: Type-safe development
- **React Router 7**: Client-side routing
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library
- **Vite**: Build tool and development server

### Backend Services
- **Firebase**: Authentication, database, and storage
- **Firestore**: NoSQL document database
- **Firebase Storage**: File storage service
- **SendGrid**: Email service provider

### Development Tools
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Vitest**: Testing framework
- **Playwright**: End-to-end testing
- **TypeScript**: Static type checking

### Document Generation
- **jsPDF**: PDF generation
- **docx**: Word document generation
- **html-docx-js**: HTML to DOCX conversion

## Documentation Structure

This documentation is organized into several comprehensive guides:

### 📚 [API Documentation](./API_DOCUMENTATION.md)
Complete reference for all public APIs, functions, and services:
- Backend service interfaces
- Database operations
- Storage operations
- Authentication APIs
- Utility functions
- Usage examples

### 🧩 [Component Documentation](./COMPONENT_DOCUMENTATION.md)
Detailed documentation for all React components:
- Layout components
- UI components
- Form components
- Modal components
- Page components
- Props and usage examples

### 📖 [Usage Guide](./USAGE_GUIDE.md)
Comprehensive user guide for the application:
- Getting started
- Feature walkthroughs
- Workflow guides
- Best practices
- Troubleshooting

### 🔧 [Types and Schemas](./TYPES_AND_SCHEMAS.md)
Complete TypeScript type definitions and Zod schemas:
- Core entity types
- Request/response types
- Component props
- Validation schemas
- Type utilities

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Firebase project with Firestore and Storage enabled
- SendGrid account (for email notifications)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd jusivo-case-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env.local` file with your Firebase configuration:
   ```bash
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
   VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
   VITE_BACKEND_PROVIDER=firebase
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   Open http://localhost:5173 in your browser

### Initial Setup

1. **Firebase Configuration**
   - Enable Authentication with Google provider
   - Create Firestore database
   - Set up Storage bucket
   - Configure security rules

2. **Database Collections**
   The application will automatically create the following collections:
   - `user_profiles`
   - `clients`
   - `matters`
   - `documents`
   - `invoices`
   - `payments`
   - `tasks`
   - `communications`
   - `deadlines`
   - `notifications`

3. **User Roles**
   - Create initial admin user
   - Configure user roles and permissions
   - Set up practice areas

## Development Guide

### Project Structure

```
jusivo-case-manager/
├── docs/                   # Documentation
├── src/
│   ├── react-app/         # Main React application
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── auth/          # Authentication
│   │   └── lib/           # Utilities and services
│   ├── shared/            # Shared utilities
│   └── types/             # Type definitions
├── public/                # Static assets
├── tests/                 # Test files
└── scripts/               # Build and deployment scripts
```

### Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Run linting
npm run lint

# Type checking
npm run check
```

### Code Style

The project follows these coding standards:

- **TypeScript**: Strict type checking enabled
- **ESLint**: Airbnb configuration with React hooks
- **Prettier**: Consistent code formatting
- **Component Structure**: Functional components with hooks
- **File Naming**: PascalCase for components, camelCase for utilities

### Adding New Features

1. **Create Types**: Define TypeScript interfaces in `src/shared/types.ts`
2. **Add Schemas**: Create Zod validation schemas
3. **Implement Services**: Add backend service methods
4. **Create Components**: Build React components
5. **Add Pages**: Create page components
6. **Update Routes**: Add routing configuration
7. **Write Tests**: Add unit and integration tests
8. **Update Documentation**: Document new features

### Testing

The project uses Vitest for unit testing and Playwright for E2E testing:

```bash
# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e

# Run tests with coverage
npm run test:coverage
```

## Deployment

### Production Build

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy to Firebase Hosting**
   ```bash
   npm run deploy
   ```

### Environment Configuration

Production environment variables:
```bash
VITE_FIREBASE_PROJECT_ID=production-project-id
VITE_FIREBASE_API_KEY=production-api-key
VITE_FIREBASE_AUTH_DOMAIN=production-auth-domain
VITE_FIREBASE_STORAGE_BUCKET=production-storage-bucket
VITE_BACKEND_PROVIDER=firebase
```

### Security Considerations

- **Firestore Rules**: Implement proper security rules
- **Storage Rules**: Secure file access permissions
- **Authentication**: Enable proper OAuth configuration
- **HTTPS**: Ensure all traffic is encrypted
- **CORS**: Configure cross-origin resource sharing

### Performance Optimization

- **Code Splitting**: Implement route-based code splitting
- **Lazy Loading**: Load components on demand
- **Image Optimization**: Compress and optimize images
- **Caching**: Implement proper caching strategies
- **CDN**: Use content delivery network for static assets

## Contributing

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/new-feature
   ```
3. **Make changes and commit**
   ```bash
   git commit -m "Add new feature"
   ```
4. **Push to your fork**
   ```bash
   git push origin feature/new-feature
   ```
5. **Create a pull request**

### Code Review Process

- All changes require code review
- Tests must pass before merging
- Documentation must be updated
- Follow established coding standards

### Reporting Issues

When reporting issues, please include:

- **Environment**: Browser, OS, Node.js version
- **Steps to Reproduce**: Detailed reproduction steps
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Screenshots**: If applicable
- **Error Messages**: Full error messages and stack traces

## Support

### Documentation

- **API Reference**: [API Documentation](./API_DOCUMENTATION.md)
- **Component Guide**: [Component Documentation](./COMPONENT_DOCUMENTATION.md)
- **User Manual**: [Usage Guide](./USAGE_GUIDE.md)
- **Type Reference**: [Types and Schemas](./TYPES_AND_SCHEMAS.md)

### Getting Help

1. **Check Documentation**: Review the comprehensive guides
2. **Search Issues**: Look for similar issues in the repository
3. **Create Issue**: Submit a detailed issue report
4. **Contact Support**: Reach out to the development team

### Community

- **GitHub Issues**: Bug reports and feature requests
- **Discussions**: General questions and community support
- **Wiki**: Additional documentation and guides

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- **Firebase**: Backend services and infrastructure
- **React Team**: Frontend framework and ecosystem
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide**: Beautiful icon library
- **SendGrid**: Email delivery service

---

**Jusivo Case Manager** - Streamlining legal practice management with modern technology.

For the most up-to-date information, please refer to the individual documentation files linked above.