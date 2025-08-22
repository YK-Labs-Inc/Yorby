import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";
import { Logger } from "next-axiom";

export async function middleware(request: NextRequest, event: NextFetchEvent) {
  const logger = new Logger({ source: "middleware" });
  logger.middleware(request);

  // Then handle session update
  event.waitUntil(logger.flush());
  const response = await updateSession(request);

  // Check if the current domain needs to be redirected
  const hostname = request.headers.get("host") || "";

  // Coaching software
  if (hostname.includes("app.yorby.ai")) {
    const { pathname } = request.nextUrl;
    if (pathname === "/") {
      return NextResponse.rewrite(new URL("/coaches", request.url));
    }
    return response;
  }

  if (hostname.includes("perfectinterview.ai")) {
    const { pathname } = request.nextUrl;
    if (pathname === "/") {
      return NextResponse.rewrite(new URL("/auth/sign-up", request.url));
    }
    return response;
  }

  return response;
}
