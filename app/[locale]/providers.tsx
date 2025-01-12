// app/providers.tsx
"use client";
import { getMessageFallback } from "@/i18n/request";
import { NextIntlClientProvider } from "next-intl";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import PostHogPageView from "./PosthogPageView";

if (typeof window !== "undefined") {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: "https://www.perfectinterview.ai/ingest",
    ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    person_profiles: "identified_only",
    capture_pageview: false, // Disable automatic pageview capture, as we capture manually
    autocapture: false,
    capture_pageleave: true,
  });
}

export function PHProvider({ children }: { children: React.ReactNode }) {
  return (
    <PostHogProvider client={posthog}>
      <PostHogPageView />
      {children}
    </PostHogProvider>
  );
}

export function IntlProvider({
  locale,
  now,
  timeZone,
  messages,
  formats,
  children,
}: {
  locale: string;
  now: Date;
  timeZone: string;
  messages: Record<string, any>;
  formats?: Record<string, any>;
  children: React.ReactNode;
}) {
  return (
    <NextIntlClientProvider
      getMessageFallback={getMessageFallback}
      locale={locale}
      now={now}
      timeZone={timeZone}
      messages={messages}
      formats={formats}
    >
      {children}
    </NextIntlClientProvider>
  );
}
