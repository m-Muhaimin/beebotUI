# Overview

BeeBot is an AI assistant platform, a modern full-stack web application with complete user authentication. It functions as an intelligent conversation partner for creative writing, data analysis, learning, and programming assistance. The application features a clean, user-friendly interface with sidebar navigation, user authentication, and a main chat interface. Its business vision is to provide a comprehensive AI assistant solution for a wide range of personal and professional tasks, aiming for broad market adoption due to its versatile capabilities.

# User Preferences

Preferred communication style: Simple, everyday language.

Tool Control: Manual tool selection preferred over automatic AI decision-making. Users want to explicitly control when tools like Web Search, Deep Research, or pure Reasoning are used.

Response Behavior: Single-response conversations preferred. AI should provide one focused response and wait for user input, not generate multiple sequential responses automatically.

# System Architecture

## Frontend Architecture

The frontend is built using **React 18** with **TypeScript**, following a modern component-based architecture. It leverages **shadcn/ui** (built on Radix UI) for consistent, accessible components, and **Tailwind CSS** for styling with a custom design system. **Wouter** handles client-side routing, **React Query** manages server state, and **React Hook Form** with **Zod** is used for type-safe form management. **Vite** is the build tool, ensuring fast development and optimized production builds. The component structure adheres to atomic design principles. The UI has been converted to light theme only, with standardized semantic CSS variables for consistent color usage and proper contrast ratios. The application features a comprehensive animated welcome screen with Framer Motion, supporting responsive design, touch/swipe navigation, keyboard navigation, and persistent user preferences. The entire application is designed to be super responsive across mobile, tablet, and desktop devices, including a dynamic sidebar with collapse/expand functionality and responsive layout adjustments for various components like the dashboard and chat interface.

## Backend Architecture

The backend uses **Express.js** with **TypeScript** in an ESM configuration. It features a RESTful API design under the `/api` prefix, with middleware for JSON parsing, CORS handling, and request logging. Centralized error handling ensures consistent responses. **esbuild** is used for fast production bundling.

## Data Storage Solutions

The application uses a **Replit-managed PostgreSQL** database with **Drizzle ORM** for type-safe database operations and schema management. **Drizzle Kit** manages database migrations. Conversation and message schemas are implemented with UUID primary keys and proper relationships. The migration from Replit Agent to standard Replit environment has been completed successfully with full authentication functionality.

## Authentication and Authorization

A complete authentication system is implemented with modern security practices. It includes bcrypt hashing for password storage, PostgreSQL session storage using `connect-pg-simple` with a 1-week TTL, and secure authentication routes. All conversation and chat endpoints require authentication. The system supports automatic session refresh, error handling, and features a beautiful signup/login UI.

## Development and Deployment

The development setup includes concurrent Vite (frontend) and Express (backend) servers. Strict TypeScript configuration with path mapping is enforced, and Replit-specific plugins are integrated for the development environment.

# External Dependencies

## Database Services
- **Replit PostgreSQL**: Managed PostgreSQL database platform with automatic provisioning.
- **Drizzle ORM**: TypeScript ORM for database operations.

## UI and Component Libraries
- **Radix UI**: Headless UI primitives.
- **shadcn/ui**: Pre-built component library based on Radix UI and Tailwind CSS.
- **Lucide React**: Icon library.

## Development and Build Tools
- **Vite**: Frontend build tool and development server.
- **esbuild**: JavaScript bundler for backend builds.
- **PostCSS**: CSS processing with Tailwind CSS and Autoprefixer.

## Utility Libraries
- **TanStack React Query**: Server state management and data fetching.
- **React Hook Form**: Form state management.
- **Zod**: TypeScript-first schema validation.
- **date-fns**: Date utility library.
- **class-variance-authority**: Utility for creating component variants.
- **clsx**: Utility for conditional CSS class concatenation.

## AI Services and Tools
- **DeepSeek API**: Advanced language model integration.
- **Jina AI MCP Tools**:
    - `read_url`: Web page content extraction (Jina Reader API).
    - `capture_screenshot_url`: Screenshot capture.
    - `search_web_jina`: Web search.
    - `search_arxiv`: Academic paper search.
- **National Weather Service API**: For accurate weather forecasts.