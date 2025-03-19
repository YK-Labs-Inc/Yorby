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
    // Skip static files, API routes, sitemaps and blog
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|_feather|ingest|_axiom|monitoring|.*\\.(?:svg|png|jpg|jpeg|gif|webp|pdf|m4a|mp4|mp3)$).*)",
    // Language paths remain unchanged
    "/(en)/:path*",
  ],
};
