# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Yorby is a comprehensive AI-powered recruitment and interview preparation platform following an open core model with two main products:

### 1. AI Recruiter for Businesses (B2B)

An AI-powered recruitment platform that helps businesses scan, assess, and interview candidates more efficiently and equitably:

**Core Functionality:**
- **Job Listing Creation**: Companies create job postings hosted on Yorby
- **Custom Interview Questions**: Recruiters upload interview questions specific to each role
- **AI-Powered Interviews**: Every candidate who applies goes through an AI interview instead of just submitting a resume
- **Voice-to-Voice Interaction**: Uses LiveKit technology for real-time voice conversations between candidates and AI interviewer
- **Automated Analysis**: AI analyzes interview performance and provides scores categorizing candidates as strong, median, or weak performers
- **Equitable Screening**: Replaces resume-based screening with actual interview performance assessment

**Technical Implementation:**
- **Company Management**: Organizations with team member roles (owner, admin, recruiter, viewer)
- **Candidate Pipeline**: Track applicants through stages (applied → screening → interviewed → reviewing → offered/rejected)
- **AI Interview Analysis**: Comprehensive performance analysis including:
  - Hiring verdict (Advance/Reject/Borderline) with match score
  - Question-by-question breakdown with quality scores
  - Identified strengths and concerns with evidence from responses
  - Job requirement alignment (matched/missing/exceeded)
  - Interview recordings with Mux video player integration
  - Full transcript with timestamps
- **Application Management**: Resume and document uploads with preview/download capabilities

### 2. AI Interview Preparation (B2C)

A candidate-facing platform for AI-powered interview preparation:

**Core Features:**
- **Job Description Upload**: Candidates upload job descriptions to generate relevant practice questions
- **Resume & Work History Integration**: Upload resumes and work documents for personalized question generation
- **Personalized Practice Questions**: AI generates tailored interview questions based on the specific job and candidate's background
- **Individual Question Practice**: Practice questions one-by-one with AI feedback on answers
- **Full Mock Interviews**: Complete AI-powered mock interview sessions using the same technology as the business recruiting platform
- **Performance Feedback**: Detailed analysis and suggestions for improvement

#### Technical Architecture:

**Database Schema**:
- `companies`: Organization profiles with slugs
- `company_members`: User-company relationships with role-based access
- `company_job_candidates`: Candidate applications and status tracking
- `candidate_application_files`: Uploaded documents linked to applications
- `custom_job_mock_interviews`: Extended with `candidate_id` for non-authenticated interviews
- `recruiter_interview_analysis`: Comprehensive AI analysis results
- Related tables: `recruiter_interview_strengths`, `recruiter_interview_concerns`, `recruiter_question_analysis`, etc.

**Key Routes**:
- `/recruiting`: Main dashboard for company recruiters
- `/recruiting/companies/[id]/jobs/[jobId]`: Job detail page with navigation to questions and candidates
- `/recruiting/companies/[id]/jobs/[jobId]/questions`: Manage interview questions with AI assistance
- `/recruiting/companies/[id]/jobs/[jobId]/candidates`: View and analyze candidate applications
- `/apply/[companyId]/[jobId]`: Public application page for candidates

**Interview Analysis Flow**:
1. Candidate applies and uploads documents
2. Candidate completes AI mock interview
3. Video is processed through Mux for streaming
4. AI analyzes responses and generates detailed feedback
5. Recruiters review analysis, recordings, and transcripts
6. Hiring decision tracked through candidate status

#### Company Onboarding Flow:

1. **New User Sign-up**: Redirected to `/company-onboarding` via `/auth/confirm`
2. **Existing User Login**: `/auth-redirect` page checks for company membership and redirects to onboarding if needed
3. **Company Registration**: Two-step form collecting company details
4. **Post-Registration**: Automatic redirect to `/dashboard/company`
5. **Protected Routes**: Middleware ensures company membership for `/dashboard/company*` routes

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
- **Video & Voice**: 
  - Mux for video processing and storage (mock interviews & practice questions)
  - LiveKit for real-time voice-to-voice AI interviews
- **Payments**: Stripe
- **Monitoring**: Sentry, PostHog, Axiom
- **Data Fetching**: SWR for real-time updates

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

**Core Platform:**
- **Users & Auth**: Managed by Supabase Auth with subscription tracking
- **Jobs**: Job positions with descriptions (supports both company postings and candidate practice)
- **Questions**: Interview questions with AI-generated guidelines (supports video recordings)
- **Mock Interviews**: Full interview sessions with video/voice recordings via Mux and LiveKit
- **Files**: User uploads with Google Cloud Storage

**Business Recruiting (B2B):**
- **Companies**: Organizations that can post jobs and interview candidates
- **Company Members**: Team members with role-based access (owner, admin, recruiter, viewer)
- **Company Job Candidates**: Candidate applications and interview tracking through the pipeline
- **Recruiter Interview Analysis**: AI-generated analysis with structured insights:
  - Main analysis with verdict and match score (strong/median/weak performer)
  - Question-level breakdowns with quality scores
  - Strengths and concerns with evidence from responses
  - Job requirement alignment tracking
- **Candidate Application Files**: Resume and document uploads linked to applications

**Interview Preparation (B2C):**
- **Practice Sessions**: Individual question practice with AI feedback
- **Personalized Questions**: AI-generated questions based on job descriptions and user resumes
- **Mock Interview Sessions**: Full AI-powered interview practice using same technology as recruiting platform
- **Performance Tracking**: Detailed feedback and improvement suggestions

Key patterns:

- Row Level Security (RLS) for data isolation with enrollment-based access
- Soft deletes with `deletion_status`
- Token usage tracking for AI features
- Webhook integration for async processing (especially Mux)
- Composite indexes for performance optimization

### Routing Architecture

**Public Routes**:
- `/` - Main Yorby landing page
- `/sign-in`, `/sign-up` - Authentication
- `/apply/[companyId]/[jobId]` - Public application page for candidates to apply to company jobs

**Business Recruiting (B2B) Routes**:
- `/recruiting` - Main dashboard for company recruiters
- `/recruiting/companies/[id]/jobs/[jobId]` - Job detail page with navigation to questions and candidates
- `/recruiting/companies/[id]/jobs/[jobId]/questions` - Manage interview questions with AI assistance
- `/recruiting/companies/[id]/jobs/[jobId]/candidates` - View and analyze candidate applications
- `/dashboard/company` - Company management and onboarding

**Interview Preparation (B2C) Routes**:
- `/dashboard/jobs` - Job-based interview preparation
- `/dashboard/practice` - Individual question practice sessions
- `/dashboard/mock-interviews` - Full mock interview sessions
- `/dashboard/resumes` - Resume builder for preparation context

**API Routes**:
- `/api/chat` - AI chat functionality for question generation and feedback
- `/api/transcribe` - Audio transcription for voice interviews
- `/api/mockInterviews/*` - Interview processing and analysis
- `/api/livekit/*` - LiveKit integration for real-time voice interviews
- `/api/recruiting/*` - Company recruiting operations
- `/api/webhooks/*` - External service integrations (Stripe, Mux, LiveKit)

### Interview Flow Architecture

**Business Recruiting Interview Flow:**
1. Company creates job posting with custom interview questions
2. Candidate applies via public application page
3. Candidate completes AI-powered voice interview using LiveKit
4. AI analyzes responses and generates comprehensive performance report
5. Recruiters review analysis, recordings, and transcripts
6. Hiring decision tracked through candidate pipeline (strong/median/weak performer)

**Interview Preparation Flow:**
1. User uploads job description and/or resume for context
2. AI generates personalized practice interview questions
3. User practices individual questions or full mock interviews
4. AI provides detailed feedback and improvement suggestions
5. Performance tracking helps users improve over time

## Open Core Licensing Model

Yorby follows an open core business model where the core functionality is available as open source, with enterprise features requiring a commercial license:

### Open Source Core (Free Tier)
- **AI Recruiter for Businesses**: Up to 50 free candidate screenings/interviews per month
- **AI Interview Preparation**: Up to 50 free practice interviews per month
- All core interview functionality including:
  - AI-powered voice interviews using LiveKit
  - Interview analysis and scoring
  - Question generation and management
  - Basic application tracking
  - Individual user accounts

### Enterprise License (Paid Tier)  
- **Unlimited Usage**: No restrictions on number of interviews or candidate screenings
- **Team Management**: Multi-user company accounts with role-based access (owner, admin, recruiter, viewer)
- **Advanced Pipeline Management**: Full candidate tracking through hiring pipeline
- **Company Branding**: Custom company profiles and job posting pages
- **Advanced Analytics**: Detailed reporting and performance insights
- **Priority Support**: Dedicated customer support

### Implementation Notes
- Usage limits enforced at the API level with monthly reset counters
- Team management features (company creation, member invitations, role assignment) gated behind enterprise license
- Core interview technology (LiveKit integration, AI analysis) remains open source
- Payment processing through Stripe for enterprise subscriptions

### State Management

Context providers handle global state:

- `UserProvider` - Authentication state
- `MultiTenantProvider` - Coach/tenant logic
- `DeepgramContextProvider` - Voice processing
- `ReferralProvider` - Referral tracking

### Environment Variables

Key required variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_OR_PUBLIC_KEY`
- `SUPABASE_SERVICE_ROLE_OR_SECRET_KEY`
- `GOOGLE_GENERATIVE_AI_API_KEY`
- `OPENAI_API_KEY`
- `STRIPE_SECRET_KEY`
- `DEEPGRAM_API_KEY`
- `MUX_TOKEN_ID` / `MUX_TOKEN_SECRET`
- `MUX_WEBHOOK_SECRET` - For verifying Mux webhook requests
- `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` - For real-time voice interviews
- `NEXT_PUBLIC_LIVEKIT_URL` - LiveKit server URL

### Development Considerations

1. **Authentication**: All protected routes require Supabase authentication
2. **File Uploads**: Use Supabase Storage or Google Cloud Storage
3. **AI Features**: Monitor token usage for cost management
4. **Video/Voice Processing**: 
   - Mux webhook handlers for async processing of recorded interviews
   - LiveKit integration for real-time voice-to-voice AI interviews
5. **Real-time Communication**: LiveKit handles voice streaming and processing
6. **Candidate Experience**: Non-authenticated candidates can complete interviews via public application flow
7. **Company Access**: Role-based permissions (owner, admin, recruiter, viewer) for business features
8. **Performance**: Use composite indexes and SWR for optimized data fetching
9. **Interview Analysis**: AI-generated comprehensive reports with structured feedback
10. **Testing**: Limited test coverage - only typewriter component has tests

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
6. Consider role-based access for business features

**Working with AI features**:

1. Use streaming responses where appropriate
2. Track token usage for cost management
3. Implement proper error handling for API failures
4. Consider rate limiting for expensive operations
5. Ensure proper context passing for personalized responses

**Business Recruiting Features**:

1. Use role-based permissions (owner, admin, recruiter, viewer)
2. Check company membership before granting access to candidate data
3. Leverage existing interview infrastructure for candidate screening
4. Support both authenticated and non-authenticated candidate flows
5. Automatic AI analysis generation after interview completion
6. File uploads handled through `candidate_application_files` table
7. Real-time status tracking through candidate pipeline
8. Interview analysis stored in structured database tables

**Interview Preparation Features**:

1. Personalize questions based on job descriptions and user resumes
2. Reuse existing mock interview infrastructure
3. Provide detailed AI feedback and improvement suggestions
4. Track user progress and performance over time
5. Support both individual question practice and full mock interviews

**Voice Interview Features (LiveKit)**:

1. Use LiveKit for real-time voice-to-voice AI interactions
2. Implement proper audio streaming and processing
3. Handle connection states and error recovery
4. Ensure low-latency voice processing
5. Integrate with existing interview analysis pipeline

**Video/Audio Features (Mux)**:

1. Use Mux for recorded video processing and storage
2. Implement proper webhook handlers for async processing
3. Track upload progress and provide user feedback
4. Support both video recordings and audio file uploads
5. Ensure proper cleanup of Mux assets when deleted

### Data Fetching Guidelines

- When performing client side data fetching use SWR to perform the data fetching
