import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";
import { Logger } from "next-axiom";

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

const PERSONA_INTERVIEW_REDIRECT_DOMAINS = [
  "lebronmockinterview",
  "chaewonmockinterview",
  "gogginsmockinterview",
];

export async function middleware(request: NextRequest, event: NextFetchEvent) {
  const logger = new Logger({ source: "middleware" });
  logger.middleware(request);

  // Then handle session update
  event.waitUntil(logger.flush());
  const response = await updateSession(request);

  // Check if the current domain needs to be redirected
  const hostname = request.headers.get("host") || "";

  const isPersonaInterviewRedirect = PERSONA_INTERVIEW_REDIRECT_DOMAINS.some(
    (domain) => hostname.includes(domain)
  );
  if (isPersonaInterviewRedirect) {
    if (hostname.includes("lebronmockinterview")) {
      return Response.redirect(
        new URL(`https://perfectinterview.ai/mock-interviews/lbj`).toString(),
        301
      );
    } else if (hostname.includes("chaewonmockinterview")) {
      return Response.redirect(
        new URL(`https://perfectinterview.ai/mock-interviews/cw`).toString(),
        301
      );
    } else if (hostname.includes("gogginsmockinterview")) {
      return Response.redirect(
        new URL(`https://perfectinterview.ai/mock-interviews/dg`).toString(),
        301
      );
    }
  }

  const isPersonaResumeRedirect = PERSONA_REDIRECT_DOMAINS.some((domain) =>
    hostname.includes(domain)
  );

  if (isPersonaResumeRedirect) {
    if (hostname.includes("lebron2resume")) {
      return Response.redirect(
        new URL(`https://perfectinterview.ai/chat-to-resume/lbj`).toString(),
        301
      );
    } else if (hostname.includes("chaewon2resume")) {
      return Response.redirect(
        new URL(`https://perfectinterview.ai/chat-to-resume/cw`).toString(),
        301
      );
    } else if (hostname.includes("goggins2resume")) {
      return Response.redirect(
        new URL(`https://perfectinterview.ai/chat-to-resume/dg`).toString(),
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

  if (hostname.includes("app.yorby.ai")) {
    const { pathname } = request.nextUrl;
    if (pathname === "/") {
      return NextResponse.rewrite(new URL("/coaches", request.url));
    }
    return response;
  }

  return response;
}
