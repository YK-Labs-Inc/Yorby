// app/posthog.js
import { PostHog } from "posthog-node";

export default function PostHogClient() {
  const posthogClient = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    api_host: process.env.NEXT_PUBLIC_POSTHOG_API_HOST,
    flushAt: 1,
    flushInterval: 0,
    disabled: process.env.NODE_ENV !== "production",
  });
  return posthogClient;
}
