import { createSupabaseServerClient } from "@/utils/supabase/server";
import { AxiomRequest, Logger, withAxiom } from "next-axiom";
import { NextResponse } from "next/server";
import * as SibApiV3Sdk from "@sendinblue/client";
import { posthog, trackServerEvent } from "@/utils/tracking/serverUtils";
import { User } from "@supabase/supabase-js";

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
      logger.error("Invalid or expired code");
      return NextResponse.redirect(
        `${origin}/sign-in?error=Invalid or expired code. Please try again.`,
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
        `${origin}/sign-in?error=Failed to verify magic link. Please try again.`,
      );
    }
    const { data: userData } = await supabase.auth.getUser();
    user = userData?.user;
    if (user?.id && user.email) {
      userInitiallySignedUp = await addUserToBrevo({
        userId: user.id,
        email: user.email,
        logger,
      });
    }
  } else if (token && type === "signup" && email) {
    logger.info("Handling user signup");
    const { error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type,
    });

    if (error) {
      logger.error("Failed to verify magic link", { error });
      return NextResponse.redirect(
        `${origin}/sign-in?error=Invalid or expired code. Please try again.`,
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
      });
    }
  } else if (type === "email_change" && token) {
    // Handle email change flow
    const { error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: "email_change",
    });
    if (error) {
      logger.error("Failed to verify email change", { error });
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
      });
    }
  }

  if (redirectTo) {
    logger.info("Redirecting to", { redirectTo });
    return NextResponse.redirect(`${redirectTo}`);
  }

  if (userInitiallySignedUp) {
    logger.info(
      "User initially signed up. Redirecting to confirm-initial-login",
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

const getRedirectToOnboardingV2 = async (user: User) => {
  const memoriesEnabled = Boolean(
    await posthog.isFeatureEnabled("enable-memories", user.id),
  );
  if (!memoriesEnabled) {
    return false;
  }
  const userHasFinishedMemoriesOnboarding = await completedMemoriesOnboarding(
    user,
  );
  if (userHasFinishedMemoriesOnboarding) {
    return false;
  }

  return memoriesEnabled && !userHasFinishedMemoriesOnboarding;
};

const completedMemoriesOnboarding = async (user: User) =>
  Boolean(user.app_metadata["completed-memories-onboarding"]);

const addUserToBrevo = async ({
  userId,
  email,
  logger,
}: {
  userId: string;
  email: string;
  logger: Logger;
}) => {
  try {
    let apiInstance = new SibApiV3Sdk.ContactsApi();
    const brevoApiKey = process.env.BREVO_API_KEY;
    if (!brevoApiKey) {
      throw new Error("BREVO_API_KEY is not set");
    }
    apiInstance.setApiKey(SibApiV3Sdk.ContactsApiApiKeys.apiKey, brevoApiKey);

    try {
      // Check if contact already exists
      logger.info("Checking if contact exists in Brevo", { email });
      await apiInstance.getContactInfo(email);
      logger.info("Contact already exists in Brevo. Skipping creation.", {
        email,
      });
      return false;
    } catch (error: any) {
      // Brevo throws an error if the contact does not exist
      logger.error("Brevo contact not found. Proceeding to create.", {
        error,
        email,
      });
      let createContact = new SibApiV3Sdk.CreateContact();
      createContact.email = email;
      createContact.listIds = [6]; // Ensure this list ID is correct

      await apiInstance.createContact(createContact);
      logger.info("Added contact to Brevo", { email });
      await trackServerEvent({
        userId,
        email,
        eventName: "user_sign_up", // Or a different event if you want to distinguish these cases
        args: {
          email,
        },
      });
      return true;
    }
  } catch (error: any) {
    // This outer catch handles errors from API key setup or if createContact itself fails
    // when called in the "else" block above or if the initial getContactInfo check error was re-thrown.
    logger.error("Failed to add user to Brevo", { error, email });
    return false;
  }
};
