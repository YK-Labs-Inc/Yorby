# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains the source code for two applications:

### 1. Perfect Interview (B2C)
A comprehensive suite of AI-powered job preparation tools featuring:
- **Resume Builder**: AI-powered resume creation through a conversational chat interface
- **Job Prep Generator**: Upload job descriptions to generate practice interview questions, with AI mock interview capabilities for realistic practice sessions
- **Interview Copilot**: Real-time interview assistance that joins meetings and helps answer questions during live interviews

### 2. Yorby (B2B)
A white-labeled platform for career coaches to power their businesses:
- Coaches can upload custom questions for their clients to practice
- Students can practice with questions and perform mock interviews
- Admin dashboard for coaches to monitor student performance
- Manual feedback capabilities for reviewing practice submissions and mock interviews
- Essentially a white-labeled version of Perfect Interview's job prep tool with coach-specific customization

## Essential Commands

```bash
# Development
pnpm run dev              # Start development server on http://localhost:3000

# Production
pnpm run build            # Build for production
pnpm run start            # Start production server

# Utilities
pnpm run translate        # Run translation script for internationalization
```

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 15.1.5 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Backend**: Supabase (Auth, Database, Storage)
- **AI Services**: Google AI SDK, OpenAI, Deepgram (speech)
- **Video**: Mux for video processing
- **Payments**: Stripe
- **Monitoring**: Sentry, PostHog, Axiom

### Key Directories
- `/app` - Next.js App Router pages and API routes
- `/components` - Reusable React components and UI library
- `/context` - React context providers for global state
- `/hooks` - Custom React hooks
- `/lib` - Core utilities and configurations
- `/utils` - Helper functions
- `/supabase/migrations` - Database schema migrations
- `/messages` - i18n translations (6 languages)

### Database Schema

The application uses a complex relational database with these main entities:
- **Users & Auth**: Managed by Supabase Auth with subscription tracking
- **Coaches**: Multi-tenant system with custom branding
- **Jobs**: Custom job positions with descriptions
- **Questions**: Interview questions with AI-generated guidelines
- **Mock Interviews**: Full interview sessions with recordings
- **Resumes**: Resume builder with sections and items
- **Interview Copilot**: Real-time interview assistance
- **Files**: User uploads with Google Cloud Storage

Key patterns:
- Row Level Security (RLS) for data isolation
- Soft deletes with `deletion_status`
- Token usage tracking for AI features
- Webhook integration for async processing

### Routing Architecture

**Public Routes**:
- `/` - Main landing page
- `/[coachSlug]` - Coach-specific branded portals
- `/sign-in`, `/sign-up` - Authentication

**Protected Routes**:
- `/dashboard/jobs` - Job management
- `/dashboard/resumes` - Resume builder
- `/dashboard/interview-copilots` - Real-time assistance
- `/dashboard/coach-admin` - Coach administration

**API Routes**:
- `/api/chat` - AI chat functionality
- `/api/transcribe` - Audio transcription
- `/api/resume/*` - Resume operations
- `/api/mockInterviews/*` - Interview processing
- `/api/webhooks/*` - External service integrations

### Multi-Tenant Coach System

Coaches can create branded experiences:
1. Custom domain/slug routing
2. Program creation and student management
3. Access control via `user_coach_access` table
4. Custom branding settings
5. Program duplication for enrolled students

### State Management

Context providers handle global state:
- `UserProvider` - Authentication state
- `MultiTenantProvider` - Coach/tenant logic
- `DeepgramContextProvider` - Voice processing
- `ReferralProvider` - Referral tracking

### Environment Variables

Key required variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_GENERATIVE_AI_API_KEY`
- `OPENAI_API_KEY`
- `STRIPE_SECRET_KEY`
- `DEEPGRAM_API_KEY`
- `MUX_TOKEN_ID` / `MUX_TOKEN_SECRET`

### Development Considerations

1. **Authentication**: All protected routes require Supabase authentication
2. **File Uploads**: Use Supabase Storage or Google Cloud Storage
3. **AI Features**: Monitor token usage for cost management
4. **Video Processing**: Mux webhook handlers for async processing
5. **Internationalization**: Support for EN, ES, FR, JP, KO, ZH
6. **Testing**: Limited test coverage - only typewriter component has tests

### Next.js App Router

This is a Next.js application using the App Router paradigm:
- All routes are defined in the `/app` directory
- Server Components are the default
- Client Components require the `"use client"` directive
- API routes are colocated in `/app/api` directories

### Logging with Axiom

The application uses Axiom for structured logging via the `next-axiom` package:

**Server Components and Server Actions**:
- Import `Logger` from `next-axiom`
- Example: `import { Logger } from "next-axiom"`
- Use `log.info()`, `log.error()`, `log.warn()` methods

**Client Components**:
- Use the `useAxiomLogging` hook from `@context/AxiomLoggingContext.tsx`
- Example: `const { logInfo, logError, logWarning } = useAxiomLogging()`
- Automatically includes userId in all logs

**Route Handlers**:
- Use `req.log` from the `AxiomRequest` object
- Example: `req.log.info("Processing request", { endpoint: "/api/example" })`

### Common Workflows

**Adding a new feature**:
1. Check existing patterns in similar features
2. Use shadcn/ui components for UI consistency
3. Follow the established file structure
4. Implement proper RLS policies for new tables
5. Add appropriate error handling and loading states

**Working with AI features**:
1. Use streaming responses where appropriate
2. Track token usage for billing
3. Implement proper error handling for API failures
4. Consider rate limiting for expensive operations

**Coach/Multi-tenant features**:
1. Always filter by coach context
2. Respect access controls
3. Handle program duplication carefully
4. Test with different coach/student scenarios