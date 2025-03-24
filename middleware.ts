import type { NextFetchEvent, NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";
import { Logger } from "next-axiom";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Create the next-intl middleware
const intlMiddleware = createIntlMiddleware(routing);

// Domains that should be redirected
const REDIRECT_DOMAINS = [
  "chattoresume",
  "chat2resume",
  "yap2resume",
  "yaptoresume",
];

const PERSONA_REDIRECT_DOMAINS = [
  "lebron2resume",
  "chaewon2resume",
  "goggins2resume",
];

export async function middleware(request: NextRequest, event: NextFetchEvent) {
  const logger = new Logger({ source: "middleware" });
  logger.middleware(request);

  // Check if the current domain needs to be redirected
  const hostname = request.headers.get("host") || "";

  const isPersonaResumeRedirect = PERSONA_REDIRECT_DOMAINS.some((domain) =>
    hostname.includes(domain)
  );

  if (isPersonaResumeRedirect) {
    if (hostname.includes("lebron2resume")) {
      return Response.redirect(
        new URL(`https://perfectinterview.ai/chat-to-resume/lbj`).toString(),
        301
      );
    } else if (hostname.includes("chaewong2resume")) {
      return Response.redirect(
        new URL(`https://perfectinterview.ai/chat-to-resume/cw`).toString(),
        301
      );
    } else if (hostname.includes("goggins2resume")) {
      return Response.redirect(
        new URL(`https://perfectinterview.ai/chat-to-resume/dw`).toString(),
        301
      );
    }
  }

  const shouldRedirect = REDIRECT_DOMAINS.some((domain) =>
    hostname.includes(domain)
  );

  if (shouldRedirect) {
    // Preserve the pathname and search params
    const redirectUrl = new URL("https://perfectinterview.ai/chat-to-resume");
    logger.info("Redirecting to new domain", {
      hostname,
      redirectUrl,
    });
    return Response.redirect(redirectUrl.toString(), 301);
  }

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
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|blog|_feather|ingest|_axiom|monitoring|.*\\.(?:svg|png|jpg|jpeg|gif|webp|pdf|m4a|mp4|mp3)$).*)",
    // Language paths remain unchanged
    "/(en)/:path*",
  ],
};
