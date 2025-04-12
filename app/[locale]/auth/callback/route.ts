import { createSupabaseServerClient } from "@/utils/supabase/server";
import { AxiomRequest, Logger, withAxiom } from "next-axiom";
import { NextResponse } from "next/server";
import * as SibApiV3Sdk from "@sendinblue/client";
import { trackServerEvent } from "@/utils/tracking/serverUtils";

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

  if (type === "magiclink") {
    logger.info("Handling magic link");
    if (!token) {
      logger.error("Invalid or expired code");
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
      logger.error("Failed to verify magic link", { error });
      return NextResponse.redirect(
        `${origin}/sign-in?error=Failed to verify magic link. Please try again.`
      );
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
        `${origin}/sign-in?error=Invalid or expired code. Please try again.`
      );
    }
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    logger = logger.with({ userId: user?.id });
    if (user?.id && email) {
      await addUserToBrevo({
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
    const user = userData?.user;
    logger = logger.with({ userId: user?.id });
    logger.info("Handling user email change");
    if (user?.id && email) {
      await addUserToBrevo({
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

  logger.info("Redirecting to jobs dashboard");
  return NextResponse.redirect(`${origin}/onboarding`);
});

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

    let createContact = new SibApiV3Sdk.CreateContact();

    createContact.email = email;
    createContact.listIds = [6];

    await apiInstance.createContact(createContact);
    logger.info("Added contact to Brevo");
    await trackServerEvent({
      userId,
      email,
      eventName: "user_sign_up",
      args: {
        email,
      },
    });
  } catch (error: any) {
    logger.error("Failed to add user to Brevo", { error });
  }
};
