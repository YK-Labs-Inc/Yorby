"use server";

import { createSupabaseServerClient } from "@/utils/supabase/server";
import { trackServerEvent } from "@/utils/tracking/serverUtils";
import { encodedRedirect } from "@/utils/utils";
import { Logger } from "next-axiom";
import { getTranslations } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const linkAnonymousAccount = async (
  prevState: any,
  formData: FormData
) => {
  const email = formData.get("email") as string;
  const redirectTo = formData.get("redirectTo") as string | undefined;
  const supabase = await createSupabaseServerClient();
  const t = await getTranslations("accountLinking");
  const origin = (await headers()).get("origin");
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
      emailRedirectTo: `${origin}${
        redirectTo ? redirectTo : "/dashboard/jobs"
      }`,
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
  const origin = (await headers()).get("origin");
  const supabase = await createSupabaseServerClient();
  const logger = new Logger().with({
    email,
    redirectTo,
    origin,
  });

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?redirect_to=${redirectTo}`,
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

export const handleSignInWithPassword = async (
  _prevState: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const captchaToken = formData.get("captchaToken") as string;
  const redirectUrl = formData.get("redirectUrl") as string;
  const t = await getTranslations("auth.login");

  if (!captchaToken) {
    return { error: t("errors.captchaRequired") };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: {
        captchaToken,
      },
    });

    if (error) {
      return { error: error.message };
    }
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : t("errors.loginFailed"),
    };
  }

  // If successful, redirect using Next.js redirect
  redirect(redirectUrl || "/auth-redirect");
};

export const handleSignUp = async (
  _prevState: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const repeatPassword = formData.get("repeatPassword") as string;
  const captchaToken = formData.get("captchaToken") as string;
  const redirectUrl = formData.get("redirectUrl") as string;
  const t = await getTranslations("auth.signUp");
  const origin = (await headers()).get("origin");

  if (!captchaToken) {
    return { error: t("errors.captchaRequired") };
  }

  if (password !== repeatPassword) {
    return { error: t("errors.passwordMismatch") };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}${redirectUrl || "/auth-redirect"}`,
        captchaToken,
      },
    });

    if (error) {
      return { error: error.message };
    }
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : t("errors.signUpFailed"),
    };
  }

  // If successful, redirect to success page
  redirect("/auth/sign-up-success");
};
