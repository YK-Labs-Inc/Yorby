# Yorby

<p align="center">
  <strong>The open-source AI-powered interview platform</strong>
</p>

<p align="center">
  AI recruitment and interview preparation that helps businesses screen candidates more efficiently and equitably while helping job seekers practice and improve their interview skills.
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#tech-stack"><strong>Tech Stack</strong></a> ·
  <a href="#self-hosting"><strong>Self-Hosting</strong></a> ·
  <a href="#contributing"><strong>Contributing</strong></a> ·
  <a href="#license"><strong>License</strong></a>
</p>

## Features

### For Businesses (B2B)
- **AI-Powered Recruitment**: Replace resume screening with actual interview assessments  
- **Voice-to-Voice Interviews**: Real-time AI interviews using LiveKit technology
- **Automated Analysis**: Comprehensive candidate scoring and performance insights
- **Custom Interview Questions**: Tailor questions specific to each role
- **Equitable Screening**: Remove bias from initial candidate assessment

### For Job Seekers (B2C)  
- **Interview Preparation**: Practice with AI-generated questions based on job descriptions
- **Mock Interviews**: Full interview sessions with detailed feedback
- **Resume Integration**: Personalized questions based on your background

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org) with App Router
- **Language**: [TypeScript](https://typescriptlang.org)
- **Database**: [Supabase](https://supabase.com) (PostgreSQL)
- **Styling**: [Tailwind CSS](https://tailwindcss.com)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com)
- **AI**: [Google AI SDK](https://ai.google.dev), [OpenAI](https://openai.com)
- **Voice/Video**: [LiveKit](https://livekit.io), [Mux](https://mux.com)
- **Speech**: [Deepgram](https://deepgram.com)
- **Payments**: [Stripe](https://stripe.com)
- **Monitoring**: [Sentry](https://sentry.io), [PostHog](https://posthog.com), [Axiom](https://axiom.co)

## Self-Hosting

Yorby can be self-hosted for free with some limitations:
- Up to 50 interviews per month
- Single user accounts only
- Core interview and analysis features included

### Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/yorby.git
   cd yorby/nextjs
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   
   Configure the following environment variables:

   #### Core Database & Authentication
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_OR_PUBLIC_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_OR_SECRET_KEY=your_service_role_key
   ```

   #### AI & Speech Services
   ```env
   GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_key
   NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_key
   OPENAI_API_KEY=your_openai_key
   DEEPGRAM_API_KEY=your_deepgram_key
   DEEPGRAM_ENV=development
   ASSEMBLY_AI_API_KEY=your_assembly_ai_key
   ```

   #### Video & Live Streaming
   ```env
   MUX_TOKEN_ID=your_mux_token_id
   MUX_TOKEN_SECRET=your_mux_token_secret
   MUX_WEBHOOK_SECRET=your_mux_webhook_secret
   LIVEKIT_URL=your_livekit_url
   LIVEKIT_API_KEY=your_livekit_key
   LIVEKIT_API_SECRET=your_livekit_secret
   ```

   #### Payment Processing
   ```env
   STRIPE_PUBLIC_KEY=your_stripe_public_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
   STRIPE_SINGLE_CREDIT_PRICE_ID=your_price_id
   STRIPE_FIVE_CREDITS_PRICE_ID=your_price_id
   STRIPE_TEN_CREDITS_PRICE_ID=your_price_id
   STRIPE_MONTHLY_PRICE_ID=your_price_id
   STRIPE_INCREASED_MONTHLY_PRICE_ID=your_price_id
   STRIPE_3_MONTH_PRICE_ID=your_price_id
   STRIPE_INCREASED_3_MONTH_PRICE_ID=your_price_id
   STRIPE_6_MONTH_PRICE_ID=your_price_id
   STRIPE_INCREASED_6_MONTH_PRICE_ID=your_price_id
   STRIPE_RECRUITING_SUBSCRIPTION_PRICE_ID=your_price_id
   ```

   #### Security & Analytics
   ```env
   NEXT_PUBLIC_HCAPTCHA_SITE_KEY=your_hcaptcha_site_key
   NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_turnstile_site_key
   TURNSTILE_SECRET_KEY=your_turnstile_secret_key
   NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
   NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
   NEXT_PUBLIC_POSTHOG_API_HOST=your_posthog_api_host
   ```

   #### Email & Notifications
   ```env
   BREVO_API_KEY=your_brevo_api_key
   RESEND_API_KEY=your_resend_api_key
   ```

   #### External Integrations
   ```env
   NOTION_API_KEY=your_notion_api_key
   GOOGLE_APPLICATION_CREDENTIALS=your_google_service_account_json
   ```

   #### Redis & Queue Management
   ```env
   UPSTASH_REDIS_REST_URL=your_upstash_redis_url
   UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
   UPSTASH_WORKFLOW_URL=your_workflow_url
   QSTASH_URL=https://qstash.upstash.io
   QSTASH_TOKEN=your_qstash_token
   QSTASH_CURRENT_SIGNING_KEY=your_signing_key
   QSTASH_NEXT_SIGNING_KEY=your_next_signing_key
   ```

   #### Application URLs
   ```env
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. Set up the database:
   ```bash
   supabase gen types --local > utils/supabase/database.types.ts
   ```

5. Run the development server:
   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

6. Set up database migrations (if needed):
   ```bash
   # Run Supabase migrations if you have a local instance
   supabase db reset
   ```

For detailed setup instructions, see our [self-hosting guide](./docs/self-hosting.md).

## Contributing

We welcome contributions from the community! Whether it's bug reports, feature requests, or code contributions, we appreciate your help in making Yorby better.

### Development

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests: `pnpm test` (when available)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Reporting Issues

If you encounter any issues, please [open an issue](https://github.com/yourusername/yorby/issues) with:
- A clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node.js version, etc.)

## License

Yorby is open-source software licensed under the [AGPL-3.0 license](LICENSE).

### Commercial Use

YK Labs Inc offers Yorby under a commercial license for organizations that want to:
- Remove usage limitations (unlimited interviews)
- Access team management features
- Get priority support
- Avoid AGPL-3.0 copyleft requirements

For commercial licensing, please [contact us](mailto:business@yorby.ai).

## Architecture

Yorby is built with modern technologies:

- **Frontend**: Next.js 15 with App Router and React 19
- **Real-time Voice**: LiveKit for voice-to-voice AI interviews  
- **Video Processing**: Mux for interview recordings and playback
- **AI Analysis**: Comprehensive candidate scoring with strengths/concerns identification
- **Multi-language**: Support for 6 languages with i18n
- **Data Security**: Row Level Security (RLS) with Supabase
- **Monitoring**: Axiom logging, Sentry error tracking, PostHog analytics

### Key Features
- **Voice Interviews**: Real-time AI conversations using LiveKit
- **Candidate Pipeline**: Track applicants from application to hiring decision
- **Role-based Access**: Owner, admin, recruiter, viewer permissions for teams
- **Interview Analysis**: AI-generated insights with match scoring
- **Usage Tracking**: Monitor API consumption and costs
- **Webhook Integration**: Async processing for video/audio content

---

<p align="center">
  <a href="https://yorby.ai">Website</a>
</p>