# Teclanc.AI - AI Website Builder

## Overview

Teclanc.AI is an AI-powered website builder that generates complete, production-ready HTML/CSS/JavaScript websites from text prompts. Users describe their desired website in natural language, and the system uses OpenAI's GPT models to generate single-file HTML websites with embedded styles and scripts. The application features a two-panel interface with prompt input on the left and live preview on the right, along with generation history management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming (light/dark mode support)
- **Build Tool**: Vite with React plugin

The frontend follows a component-based architecture with:
- Pages in `client/src/pages/`
- Reusable UI components in `client/src/components/ui/`
- Custom hooks in `client/src/hooks/`
- Utility functions in `client/src/lib/`

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Design**: RESTful endpoints under `/api/` prefix
- **Development Server**: Vite dev server integrated with Express for HMR
- **Production**: Static file serving from built assets

Key API endpoints:
- `POST /api/generate` - Generate website from prompt using OpenAI
- `GET /api/generations` - Retrieve generation history
- `DELETE /api/generations/:id` - Remove a generation

### Data Storage
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts`
- **Current Implementation**: In-memory storage (`MemStorage` class) for development
- **Database Ready**: Schema defined for `users` and `generations` tables

Database tables:
- `users`: User authentication (id, username, password)
- `generations`: Website generation history (id, prompt, generatedHtml, createdAt)

### AI Integration
- **Provider**: OpenAI API (GPT models)
- **Purpose**: Converts natural language prompts into complete HTML websites
- **Output**: Single HTML file with embedded CSS (`<style>`) and JavaScript (`<script>`)
- **System Prompt**: Enforces strict output rules for clean, production-ready code without frameworks or external dependencies

### Design System
- **Typography**: Inter for UI, JetBrains Mono for code
- **Layout**: Two-panel split interface (40% input, 60% preview)
- **Theme**: Linear/VS Code inspired developer aesthetics
- **Components**: Modern, minimal, professional styling with smooth hover effects

## External Dependencies

### AI Services
- **OpenAI API**: Required for website generation (`OPENAI_API_KEY` environment variable)

### Database
- **PostgreSQL**: Required for persistent storage (`DATABASE_URL` environment variable)
- Uses Drizzle ORM for database operations
- Schema migrations managed via `drizzle-kit push`

### Key NPM Packages
- `openai`: OpenAI API client for GPT integration
- `drizzle-orm` / `drizzle-zod`: Database ORM and schema validation
- `@tanstack/react-query`: Server state management
- `@radix-ui/*`: Accessible UI primitives
- `tailwindcss`: Utility-first CSS framework
- `zod`: Runtime type validation for API requests

### Development Tools
- `vite`: Build tool and dev server
- `tsx`: TypeScript execution for server
- `esbuild`: Production bundling for server code