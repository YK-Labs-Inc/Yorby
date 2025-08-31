"use server";

import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Logger } from "next-axiom";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function signInWithOTP(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const captchaToken = formData.get("captchaToken") as string;
  const supabase = await createSupabaseServerClient();
  const logger = new Logger().with({
    function: "signInWithOTP",
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

  logger.info("OTP sent successfully");
  await logger.flush();

  return {
    email,
    success: true,
    error: "",
  };
}

export async function verifyOTP(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const token = formData.get("token") as string;
  const redirectTo = formData.get("redirectTo") as string;
  const origin = (await headers()).get("origin");
  const supabase = await createSupabaseServerClient();
  const logger = new Logger().with({
    function: "verifyOTP",
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

  logger.info("OTP verified successfully");
  await logger.flush();

  // Successful verification - redirect directly
  redirect(redirectTo.includes("http") ? redirectTo : `${origin}${redirectTo}`);
}
