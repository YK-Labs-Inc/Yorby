"use server";

import { createSupabaseServerClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export async function signInWithOTP(formData: FormData) {
  const email = formData.get("email") as string;
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    return redirect(
      `/sign-in?message=Failed to send magic link. Please try again.`
    );
  }

  return redirect(`/sign-in?message=Check your email for the magic link.`);
}
