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
- Students can practice with questions and perform mock interviews (both text and video)
- Admin dashboard for coaches to monitor student performance and enrollments
- Manual feedback capabilities for reviewing practice submissions and mock interviews
- Enrollment-based access control system for student program access
- Coach-only portals with dedicated authentication flow
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

# Supabase
supabase gen types --local > utils/supabase/database.types.ts  # Generate Supabase TypeScript types
```

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 15.1.5 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Backend**: Supabase (Auth, Database, Storage)
- **AI Services**: Google AI SDK, OpenAI, Deepgram (speech)
- **Video**: Mux for video processing and storage (mock interviews & practice questions)
- **Payments**: Stripe
- **Monitoring**: Sentry, PostHog, Axiom
- **Data Fetching**: SWR for real-time updates in coach portal

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
- **Questions**: Interview questions with AI-generated guidelines (supports video recordings)
- **Mock Interviews**: Full interview sessions with video recordings via Mux
- **Resumes**: Resume builder with sections and items
- **Interview Copilot**: Real-time interview assistance
- **Files**: User uploads with Google Cloud Storage
- **Enrollments**: `custom_job_enrollments` table managing student access to coach programs
- **Submissions**: Practice question submissions with text/video responses

Key patterns:
- Row Level Security (RLS) for data isolation with enrollment-based access
- Soft deletes with `deletion_status`
- Token usage tracking for AI features
- Webhook integration for async processing (especially Mux)
- Composite indexes for performance optimization

### Routing Architecture

**Public Routes**:
- `/` - Main landing page
- `/[coachSlug]` - Coach-specific branded portals
- `/coaches` - Coach portal landing page
- `/coaches/auth` - Coach authentication with redirect handling
- `/sign-in`, `/sign-up` - Authentication

**Protected Routes**:
- `/dashboard/jobs` - Job management
- `/dashboard/resumes` - Resume builder
- `/dashboard/interview-copilots` - Real-time assistance
- `/dashboard/coach-admin` - Coach administration
- `/dashboard/coach-admin/students` - Student management and enrollment tracking
- `/dashboard/coach-admin/students/[studentId]/programs` - View student's enrolled programs
- `/dashboard/coach-admin/students/[studentId]/jobs/[jobId]/questions/[questionId]` - Review submissions
- `/dashboard/coach-admin/students/[studentId]/jobs/[jobId]/mockInterviews/[mockInterviewId]` - Review mock interviews

**API Routes**:
- `/api/chat` - AI chat functionality
- `/api/transcribe` - Audio transcription
- `/api/resume/*` - Resume operations
- `/api/mockInterviews/*` - Interview processing
- `/api/webhooks/*` - External service integrations (Stripe, Mux)
- `/api/coach/[coachId]/register` - Student registration for coach programs
- `/api/admin/migrate-enrollments` - Enrollment system migration

### Multi-Tenant Coach System

Coaches can create branded experiences:
1. Custom domain/slug routing
2. Program creation and student management
3. Enrollment-based access control via `custom_job_enrollments` table
4. Custom branding settings
5. Coach-only authentication and access routes
6. Student performance tracking and submission reviews
7. Video/audio support for practice questions and mock interviews

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
- `MUX_WEBHOOK_SECRET` - For verifying Mux webhook requests

### Development Considerations

1. **Authentication**: All protected routes require Supabase authentication
2. **File Uploads**: Use Supabase Storage or Google Cloud Storage
3. **AI Features**: Monitor token usage for cost management
4. **Video Processing**: Mux webhook handlers for async processing of mock interviews and practice questions
5. **Internationalization**: Support for EN, ES, FR, JP, KO, ZH
6. **Testing**: Limited test coverage - only typewriter component has tests
7. **Enrollment System**: Students must be enrolled in programs to access coach content
8. **Performance**: Use composite indexes and SWR for optimized data fetching
9. **Coach Access**: Separate authentication flow for coaches vs students

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
- **IMPORTANT**: When initializing the logger, always use the `with()` function and pass a JSON object containing the function name and its parameters

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
6. Consider enrollment-based access for coach features

**Working with AI features**:
1. Use streaming responses where appropriate
2. Track token usage for billing
3. Implement proper error handling for API failures
4. Consider rate limiting for expensive operations

**Coach/Multi-tenant features**:
1. Always filter by coach context and enrollment status
2. Implement enrollment-based RLS policies
3. Use SWR for real-time data updates in coach portal
4. Test with different coach/student enrollment scenarios
5. Ensure proper video/audio handling for submissions

**Video/Audio Features**:
1. Use Mux for all video processing and storage
2. Implement proper webhook handlers for async processing
3. Track upload progress and block UI during uploads
4. Support both video recordings and audio file uploads
5. Ensure proper cleanup of Mux assets when deleted

**Working with Enrollments**:
1. Check enrollment status before granting access
2. Use the `custom_job_enrollments` table for access control
3. Implement proper cascade deletes for enrollment-related data
4. Consider performance with composite indexes

### Data Fetching Guidelines

- When performing client side data fetching use SWR to perform the data fetching