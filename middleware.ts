import type { NextFetchEvent, NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";
import { Logger } from "next-axiom";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Create the next-intl middleware
const intlMiddleware = createIntlMiddleware(routing);

export async function middleware(request: NextRequest, event: NextFetchEvent) {
  const logger = new Logger({ source: "middleware" });
  logger.middleware(request);

  // Handle next-intl middleware first
  const response = await intlMiddleware(request);
  if (response) return response;

  // Then handle session update
  event.waitUntil(logger.flush());
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Skip static files, sitemaps and blog
    "/((?!_next/static|_next/image|favicon.ico|sitemap*.xml|blog|_feather|.*\\.(?:svg|png|jpg|jpeg|gif|webp|pdf|m4a|mp4|mp3)$).*)",
    // Language paths remain unchanged
    "/(en|zh|hi|es|bn|fr|pt|ru|id|de|ja|sw|mr|te|vi|ta|ko|it|th|pl|gu|uk|kn|ml|tl|ro|nl|ms|or|my|hu|cs|el|sv|bg|ne|sk|da|fi|no|hr|lt|km|mn|lo|et|sl|lv|sq|mk)/:path*",
  ],
};
