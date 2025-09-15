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