"use server";

import { createSupabaseServerClient } from "@/utils/supabase/server";
import { trackServerEvent } from "@/utils/tracking/serverUtils";
import { encodedRedirect } from "@/utils/utils";
import { Logger } from "next-axiom";
import { getTranslations } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export const linkAnonymousAccount = async (
  prevState: any,
  formData: FormData
) => {
  const email = formData.get("email") as string;
  const supabase = await createSupabaseServerClient();
  const t = await getTranslations("accountLinking");
  const logger = new Logger().with({
    email,
  });

  if (!email) {
    logger.error("Email is required");
    await logger.flush();
    return {
      error: t("emailRequiredError"),
    };
  }

  const { error } = await supabase.auth.updateUser(
    {
      email,
    },
    {
      emailRedirectTo: `https://${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/jobs`,
    }
  );

  if (error) {
    logger.error("Error linking anonymous account", {
      error,
    });
    await logger.flush();
    return {
      error: error.message,
    };
  }
  const user = await supabase.auth.getUser();
  if (user.data.user?.id) {
    await trackServerEvent({
      eventName: "anonymous_account_linked",
      userId: user.data.user.id,
      email,
    });
  }

  return {
    success: t("authSuccess"),
  };
};

export async function signInWithOTP(formData: FormData) {
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
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?redirect_to=${redirectTo}`,
      captchaToken,
    },
  });

  if (error) {
    logger.error("Failed to send magic link", { error });
    await logger.flush();
    return encodedRedirect("authError", redirectTo, error.message);
  }

  return encodedRedirect(
    "authSuccess",
    redirectTo,
    "Check your email for the magic link."
  );
}

export const handleSignOut = async (data: FormData) => {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath("/");
  redirect("/");
};
