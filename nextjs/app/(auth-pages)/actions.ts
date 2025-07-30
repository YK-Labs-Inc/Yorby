"use server";

import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Logger } from "next-axiom";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function signInWithOTP(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const redirectTo = formData.get("redirectTo") as string | null;
  const captchaToken = formData.get("captchaToken") as string;
  const supabase = await createSupabaseServerClient();
  const origin = (await headers()).get("origin");
  const logger = new Logger().with({
    email,
    redirectTo,
  });

  let options: { captchaToken: string; emailRedirectTo?: string } = {
    captchaToken,
  };

  if (redirectTo) {
    options.emailRedirectTo = `${origin}${redirectTo}`;
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options,
  });

  if (error) {
    logger.error("Failed to send magic link", { error });
    await logger.flush();
    return { error: error.message };
  }

  return {
    success:
      "We sent you a sign-in link to your email. Please click it to continue.",
  };
}

export async function verifyOTP(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const token = formData.get("token") as string;
  const redirectTo = formData.get("redirectTo") as string;
  const origin = (await headers()).get("origin");
  const supabase = await createSupabaseServerClient();
  const logger = new Logger().with({
    email,
    redirectTo,
  });

  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });

  if (error) {
    logger.error("Failed to verify OTP", { error });
    await logger.flush();
    return { error: error.message };
  }

  // Successful verification - redirect directly
  redirect(redirectTo.includes("http") ? redirectTo : `${origin}${redirectTo}`);
}
