# Overview

BeeBot is an AI assistant platform built as a modern full-stack web application with complete user authentication. The project serves as an intelligent conversation partner designed to help users with creative writing, data analysis, learning, and programming assistance. The application features a clean, user-friendly interface with a sidebar navigation system, user authentication, and a main chat interface for interacting with the AI assistant.

## Recent Changes (August 2025)

- **Migration to Replit Environment**: Successfully migrated from Replit Agent to standard Replit environment (Completed August 12, 2025)
- **Critical Bug Fix**: Fixed infinite loop issue in conversation auto-trigger causing rapid API calls (Fixed August 12, 2025)
- **Stop Button Implementation**: Added ability for send button to act as stop button during AI response streaming, preserving partial content when stopped (Fixed August 12, 2025)
- **Critical Bug Fix**: Fixed infinite loop issue in conversation auto-trigger causing rapid API calls (Fixed August 12, 2025)
- **UI Improvements**: Fixed sign in/sign up buttons to be properly centered across all device types with responsive design
- **Environment Setup**: Configured all required dependencies including Node.js packages (tsx, TypeScript, Vite) and Python packages (httpx)
- **Secret Management**: Successfully configured DATABASE_URL, DEEPSEEK_API_KEY, and EXA_API_KEY environment variables
- **Database Configuration**: Fixed PostgreSQL connection issues and properly configured database access
- **Authentication System**: Implemented complete user signup/login system with PostgreSQL storage
- **UI Enhancement**: Added beautiful authentication pages with light background (#5239cc12) and soft borders
- **Security**: Added bcrypt password hashing and session-based authentication
- **Protected Routes**: All conversation features now require user authentication
- **User Profile**: Dynamic user profile display in sidebar with logout functionality and improved truncation
- **Input Section Improvements**: Applied precise styling with specific padding (pt-[30px] pb-[30px] pl-[20px] pr-[20px])
- **Tool Selection**: Added interactive tool selection buttons inside input field with active states
- **Chat Enhancement**: Implemented proper markdown rendering for structured chat output
- **Responsive Design**: Fine-tuned component spacing and button styling throughout the interface
- **Error Handling**: Fixed server error handling to prevent "headers already sent" issues
- **Bug Fixes (August 10, 2025)**: Fixed critical authentication session persistence, MCP server initialization, type safety issues, and API key integration for DeepSeek and Exa services
- **Tool Integration**: Successfully implemented weather forecasting and web search/research capabilities through MCP servers
- **Session Management**: Enhanced session handling with forced session saves to prevent authentication failures
- **Manual Tool Selection**: Implemented user-controlled tool selection with Reasoning, Web Search, and Deep Research modes instead of automatic AI decision-making
- **Response Control**: Fixed issue where AI generated multiple sequential responses automatically; now provides single, focused responses that wait for user input
- **Animated Welcome Screen (August 11, 2025)**: Implemented comprehensive animated welcome screen with Framer Motion featuring:
  - Native app-like experience with 5-step onboarding tour
  - Full responsive design for mobile, tablet, and desktop devices
  - Touch/swipe navigation support for mobile devices
  - Keyboard navigation (arrow keys, ESC, ENTER) for desktop
  - Interactive progress indicators and feature highlights
  - Auto-advancing slides with manual override capability
  - Persistent user preferences using localStorage
  - Accessibility features with ARIA labels and keyboard focus management
  - Help button integration for replaying welcome tour
  - Smooth animations and transitions throughout the experience
- **Complete Responsive Design Overhaul (August 11, 2025)**: Made entire application super responsive:
  - Welcome screen: Compact and cleaner elements with proper mobile/tablet/desktop breakpoints
  - Dashboard: Responsive grid layout, mobile-first design with touch-friendly interfaces
  - Sidebar: Dynamic width scaling (60-80px range) with responsive logo and search components
  - Chat interface: Mobile-optimized message bubbles, responsive headers, and touch-friendly buttons
  - Typography scaling: Adaptive text sizes across all devices (xs/sm/base/lg breakpoints)
  - Button optimization: Mobile hamburger menus, icon-only modes, and proper touch targets
  - Spacing system: Consistent responsive padding/margins using Tailwind's responsive modifiers
- **AI Response Result Grouping (August 12, 2025)**: Enhanced conversation UI with intelligent result parsing:
  - Automatic detection of "Result 1:", "Result 2:", etc. patterns in AI responses
  - Visual grouping of results with numbered badges and distinct sections
  - Enhanced styling with gradient headers, hover effects, and proper spacing
  - Support for both light and dark themes with appropriate color schemes
  - Maintains regular markdown parsing for non-result content
  - Seamless integration with existing MarkdownRenderer component
- **Sidebar Collapse/Expand Functionality (August 12, 2025)**: Added comprehensive sidebar toggle functionality:
  - Toggle button positioned on the right side of sidebar header with smooth animations
  - Responsive behavior: automatic toggle button on desktop (lg+) and manual button on mobile/tablet
  - Smooth width transitions (300ms duration) between expanded and collapsed states
  - Collapsed state shows only icons with tooltips for navigation items
  - Search bar and conversation history hidden when collapsed for clean minimal view
  - User profile adapts to show dropdown menu from avatar in collapsed mode
  - Consistent functionality across both Home and Conversation pages
  - Mobile-friendly toggle buttons in page headers for smaller screens
  - **Enhanced Icon Sizing (August 12, 2025)**: Optimized collapsed sidebar visual hierarchy:
    - Larger logo icon (w-6 h-6) and container (w-10 h-10) in collapsed state
    - Enhanced navigation icons (w-6 h-6) for better visibility when collapsed
    - Improved user avatar size (w-10 h-10) in collapsed mode
    - Consistent toggle button positioning across all screen sizes
    - Smooth size transitions with 300ms duration for all interactive elements

# User Preferences

Preferred communication style: Simple, everyday language.

Tool Control: Manual tool selection preferred over automatic AI decision-making. Users want to explicitly control when tools like Web Search, Deep Research, or pure Reasoning are used.

Response Behavior: Single-response conversations preferred. AI should provide one focused response and wait for user input, not generate multiple sequential responses automatically.

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

## AI Services and Tools
- **DeepSeek API**: Advanced language model integration for intelligent chat responses and conversation generation
- **Exa API**: Powerful web search and research capabilities for real-time information retrieval and comprehensive topic analysis
- **MCP (Model Context Protocol)**: Server architecture for weather forecasting tools and search functionality integration
- **Weather Services**: Integration with National Weather Service API for accurate weather forecasts and alerts
- **Research Tools**: Deep research capabilities with source aggregation, recent developments tracking, and comprehensive analysis