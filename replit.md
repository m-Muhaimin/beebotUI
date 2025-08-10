# Overview

BeeBot is an AI assistant platform built as a modern full-stack web application with complete user authentication. The project serves as an intelligent conversation partner designed to help users with creative writing, data analysis, learning, and programming assistance. The application features a clean, user-friendly interface with a sidebar navigation system, user authentication, and a main chat interface for interacting with the AI assistant.

## Recent Changes (August 2025)

- **Authentication System**: Implemented complete user signup/login system with PostgreSQL storage
- **UI Enhancement**: Added beautiful authentication pages based on modern blue gradient design
- **Security**: Added bcrypt password hashing and session-based authentication
- **Protected Routes**: All conversation features now require user authentication
- **User Profile**: Dynamic user profile display in sidebar with logout functionality

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

The frontend is built using **React 18** with **TypeScript** and follows a modern component-based architecture:

- **UI Framework**: Uses shadcn/ui component library built on top of Radix UI primitives for consistent, accessible components
- **Styling**: Tailwind CSS with a custom design system including CSS variables for theming and brand colors
- **Routing**: Client-side routing implemented with Wouter for lightweight navigation
- **State Management**: React Query (TanStack Query) for server state management and data fetching
- **Form Handling**: React Hook Form with Zod validation for type-safe form management
- **Build Tool**: Vite for fast development and optimized production builds

The component structure follows atomic design principles with reusable UI components in the `/components/ui` directory and feature-specific components like `Sidebar`, `InputSection`, and `ConversationHistory`.

## Backend Architecture

The backend uses **Express.js** with **TypeScript** in an ESM configuration:

- **Server Framework**: Express.js with middleware for JSON parsing, CORS handling, and request logging
- **Development Setup**: Custom Vite integration for hot module replacement in development
- **API Structure**: RESTful API design with routes prefixed under `/api`
- **Error Handling**: Centralized error handling middleware for consistent error responses
- **Build Process**: esbuild for fast production bundling with external package handling

The server architecture is modular with separate files for routes (`routes.ts`) and storage interfaces (`storage.ts`).

## Data Storage Solutions

The application uses a **Supabase PostgreSQL** database with **Drizzle ORM**:

- **Database**: Supabase PostgreSQL as the primary database (serverless PostgreSQL platform)
- **ORM**: Drizzle ORM for type-safe database operations and schema management
- **Migrations**: Drizzle Kit for database schema migrations stored in `/migrations`
- **Schema**: Centralized schema definitions in `/shared/schema.ts` with Zod validation
- **Connection**: Direct PostgreSQL connection via Drizzle with Supabase connection string

Implements conversation and message schemas for AI chat functionality with UUID primary keys and proper relationships.

## Authentication and Authorization

Complete authentication system implemented with modern security practices:

- **User Model**: Enhanced schema with email, username, password, firstName, lastName, and profile fields
- **Password Security**: bcrypt hashing with salt rounds for secure password storage
- **Session Management**: PostgreSQL session storage using connect-pg-simple with 1-week TTL
- **Authentication Routes**: /api/auth/signup, /api/auth/login, /api/auth/logout, /api/auth/me
- **Protected Routes**: All conversation and chat endpoints require authentication
- **Frontend Integration**: React hooks (useAuth, useSignup, useLogin, useLogout) for seamless UI integration
- **UI Components**: Beautiful signup/login page based on modern blue gradient design with form validation

The system includes automatic session refresh, error handling, and proper client-server separation for security.

## Development and Deployment

- **Development**: Concurrent development server setup with Vite frontend and Express backend
- **TypeScript**: Strict TypeScript configuration with path mapping for clean imports
- **Code Quality**: ESLint and Prettier configuration implied through component structure
- **Replit Integration**: Custom Replit-specific plugins for development environment integration

# External Dependencies

## Database Services
- **Supabase**: Serverless PostgreSQL database platform with real-time capabilities and built-in authentication
- **Drizzle ORM**: Modern TypeScript ORM for database operations and schema management

## UI and Component Libraries
- **Radix UI**: Headless UI primitives for building accessible components (dialogs, dropdowns, forms, etc.)
- **shadcn/ui**: Pre-built component library built on Radix UI with Tailwind CSS styling
- **Lucide React**: Icon library providing consistent iconography throughout the application

## Development and Build Tools
- **Vite**: Frontend build tool and development server with React plugin support
- **esbuild**: Fast JavaScript bundler for production backend builds
- **PostCSS**: CSS processing with Tailwind CSS and Autoprefixer plugins

## Utility Libraries
- **TanStack React Query**: Server state management and data fetching library
- **React Hook Form**: Form state management with validation support
- **Zod**: TypeScript-first schema validation library
- **date-fns**: Date utility library for date manipulation and formatting
- **class-variance-authority**: Utility for creating component variants with Tailwind CSS
- **clsx**: Utility for conditional CSS class concatenation

## Replit Platform Integration
- **Replit Development Tools**: Custom Vite plugins for Replit environment integration and error overlay functionality