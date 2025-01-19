"use server";

import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Logger } from "next-axiom";
import { redirect } from "next/navigation";

export async function signInWithOTP(formData: FormData) {
  const email = formData.get("email") as string;
  const redirectTo = (formData.get("redirectTo") as string) || "/";
  const supabase = await createSupabaseServerClient();
  const logger = new Logger().with({
    email,
    redirectTo,
  });

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    logger.error("Failed to send magic link", { error });
    await logger.flush();
    return redirect(
      `${redirectTo}?message=Failed to send magic link. Please try again.`
    );
  }

  return redirect(`${redirectTo}?message=Check your email for the magic link.`);
}
