import { createSupabaseServerClient } from "@/utils/supabase/server";
import { AxiomRequest, withAxiom } from "next-axiom";
import { NextResponse } from "next/server";
import { User } from "@supabase/supabase-js";
import { addUserToBrevo, getRedirectToOnboardingV2 } from "../utils";

export const GET = withAxiom(async (request: AxiomRequest) => {
  // The `/auth/callback` route is required for the server-side auth flow implemented
  // by the SSR package. It exchanges an auth code for the user's session.
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const requestUrl = new URL(request.url);
  const token = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const email = requestUrl.searchParams.get("email");
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;
  const redirectTo = requestUrl.searchParams.get("redirect_to")?.toString();
  let logger = request.log.with({
    code,
    type,
    email,
    origin,
    redirectTo,
    token,
    path: "/auth/callback",
  });

  const supabase = await createSupabaseServerClient();
  let user: User | null = null;
  let userInitiallySignedUp = false;

  if (type === "magiclink") {
    logger.info("Handling magic link");
    if (!token) {
      return NextResponse.redirect(
        `${origin}/sign-in?error=Invalid or expired code. Please try again.`
      );
    }
    // Handle magic link flow
    const { error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: "magiclink",
    });
    if (error) {
      return NextResponse.redirect(
        `${origin}/sign-in?error=Failed to verify magic link. Please try again.`
      );
    }
    const { data: userData } = await supabase.auth.getUser();
    user = userData?.user;
    if (user?.id && user.email) {
      userInitiallySignedUp = await addUserToBrevo({
        userId: user.id,
        email: user.email,
        logger,
        origin,
      });
    }
  } else if (token && type === "signup" && email) {
    logger.info("Handling user signup");
    const { error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type,
    });

    if (error) {
      return NextResponse.redirect(
        `${origin}/sign-in?error=Invalid or expired code. Please try again.`
      );
    }
    const { data: userData } = await supabase.auth.getUser();
    user = userData?.user;
    logger = logger.with({ userId: user?.id });
    if (user?.id && email) {
      userInitiallySignedUp = await addUserToBrevo({
        userId: user.id,
        email,
        logger,
        origin,
      });
      if (userInitiallySignedUp) {
        logger.info(
          "User initially signed up. Redirecting to confirm-initial-login"
        );
        return NextResponse.redirect(`${origin}/confirm-initial-login`);
      }
    }
  } else if (type === "email_change" && token) {
    // Handle email change flow
    const { error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: "email_change",
    });
    if (error) {
      return NextResponse.redirect(`${origin}/sign-up?error=${error.message}`);
    }
    const { data: userData } = await supabase.auth.getUser();
    user = userData?.user;
    logger = logger.with({ userId: user?.id });
    logger.info("Handling user email change");
    if (user?.id && email) {
      userInitiallySignedUp = await addUserToBrevo({
        userId: user.id,
        email,
        logger,
        origin,
      });
    }
  }

  if (redirectTo) {
    logger.info("Redirecting to", { redirectTo });
    return NextResponse.redirect(`${redirectTo}`);
  }

  if (userInitiallySignedUp) {
    logger.info(
      "User initially signed up. Redirecting to confirm-initial-login"
    );
    return NextResponse.redirect(`${origin}/confirm-initial-login`);
  }

  let redirectToOnboardingV2 = false;
  if (user) {
    redirectToOnboardingV2 = await getRedirectToOnboardingV2(user);
  }
  logger = logger.with({ redirectToOnboardingV2 });
  if (redirectToOnboardingV2) {
    logger.info("Redirecting to onboarding-v2");
    return NextResponse.redirect(`${origin}/onboarding-v2`);
  }
  logger.info("Redirecting to onboarding");
  return NextResponse.redirect(`${origin}/onboarding`);
});
