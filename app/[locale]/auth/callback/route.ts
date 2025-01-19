import { createSupabaseServerClient } from "@/utils/supabase/server";
import { AxiomRequest, withAxiom } from "next-axiom";
import { NextResponse } from "next/server";

export const GET = withAxiom(async (request: AxiomRequest) => {
  // The `/auth/callback` route is required for the server-side auth flow implemented
  // by the SSR package. It exchanges an auth code for the user's session.
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const requestUrl = new URL(request.url);
  const token = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const email = requestUrl.searchParams.get("email");
  const origin = requestUrl.origin;
  const redirectTo = requestUrl.searchParams.get("redirect_to")?.toString();
  const logger = request.log.with({
    type,
    email,
    origin,
    redirectTo,
    path: "/auth/callback",
  });

  const supabase = await createSupabaseServerClient();

  if (type === "magiclink") {
    if (!token) {
      logger.error("Invalid or expired code");
      return NextResponse.redirect(
        `${origin}/sign-in?message=Invalid or expired code. Please try again.`
      );
    }
    // Handle magic link flow
    const { error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: "magiclink",
    });
    if (error) {
      logger.error("Failed to verify magic link", { error });
      return NextResponse.redirect(
        `${origin}/sign-in?message=Failed to verify magic link. Please try again.`
      );
    }
  } else if (token && type === "signup" && email) {
    // Handle email OTP verification
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "magiclink",
    });

    if (error) {
      logger.error("Failed to verify magic link", { error });
      return NextResponse.redirect(
        `${origin}/sign-in?message=Invalid or expired code. Please try again.`
      );
    }
  }

  if (redirectTo) {
    return NextResponse.redirect(`${origin}${redirectTo}`);
  }

  // URL to redirect to after sign up process completes
  return NextResponse.redirect(`${origin}/dashboard/jobs`);
});
