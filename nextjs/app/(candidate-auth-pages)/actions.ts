"use server";

import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Logger } from "next-axiom";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { addUserToBrevo } from "../auth/utils";

export async function signInWithOTP(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const captchaToken = formData.get("captchaToken") as string;
  const supabase = await createSupabaseServerClient();
  const logger = new Logger().with({
    email,
  });

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      captchaToken,
      shouldCreateUser: true,
    },
  });

  if (error) {
    logger.error("Failed to send OTP", { error });
    await logger.flush();
    return { error: error.message, success: false, email: "" };
  }

  return {
    email,
    success: true,
  };
}

export async function verifyOTP(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const token = formData.get("token") as string;
  const redirectTo = formData.get("redirectTo") as string;
  const origin = (await headers()).get("origin");
  const supabase = await createSupabaseServerClient();
  const t = await getTranslations("auth.candidateAuth");
  let logger = new Logger().with({
    email,
    redirectTo,
  });

  const {
    error,
    data: { user },
  } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });

  if (error) {
    logger.error("Failed to verify OTP", { error });
    await logger.flush();
    return { error: error.message };
  }

  if (!user || !origin || !user.email) {
    logger.error("Failed to verify OTP", { error });
    await logger.flush();
    return { error: t("errors.genericError") };
  }

  if (redirectTo) {
    // Successful verification - redirect directly
    redirect(
      redirectTo.includes("http") ? redirectTo : `${origin}${redirectTo}`
    );
  }

  // If user is added to brevo successfully this means the user signed up for the first time
  const userInitiallySignedUp = await addUserToBrevo({
    userId: user.id,
    email: user.email,
    logger,
    origin,
  });

  if (userInitiallySignedUp) {
    logger.info(
      "User initially signed up. Redirecting to confirm-initial-login"
    );
    redirect("/confirm-initial-login");
  }
  logger.info("Redirecting to onboarding");
  redirect(
    user.app_metadata.completed_candidate_onboarding
      ? "/dashboard/jobs?newJob=true"
      : "/onboarding"
  );
}
