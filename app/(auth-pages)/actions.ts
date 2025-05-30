"use server";

import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Logger } from "next-axiom";
import { headers } from "next/headers";

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
