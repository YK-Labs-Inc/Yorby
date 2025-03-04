"use server";

import { createSupabaseServerClient } from "@/utils/supabase/server";
import { encodedRedirect } from "@/utils/utils";
import { Logger } from "next-axiom";

export async function signInWithOTP(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const redirectTo = (formData.get("redirectTo") as string) || "/";
  const captchaToken = formData.get("captchaToken") as string;
  const supabase = await createSupabaseServerClient();
  const logger = new Logger().with({
    email,
    redirectTo,
  });

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      captchaToken,
    },
  });

  if (error) {
    logger.error("Failed to send magic link", { error });
    await logger.flush();
    return { error: error.message };
  }

  return { success: "Check your email for the magic link." };
}
