"use server";

import { createSupabaseServerClient } from "@/utils/supabase/server";
import { getServerUser } from "@/utils/auth/server";
import { Logger } from "next-axiom";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";

export const resendConfirmationEmail = async (
  prevState: {
    error: string | null;
    success: boolean | null;
  },
  formData: FormData
) => {
  const companyId = formData.get("companyId") as string;
  const jobId = formData.get("jobId") as string;
  const interviewId = formData.get("interviewId") as string;
  const captchaToken = formData.get("captchaToken") as string;
  const supabase = await createSupabaseServerClient();
  const t = await getTranslations("apply.confirmEmail.errors");
  const logger = new Logger().with({
    function: "resendConfirmationEmail",
  });

  try {
    if (!captchaToken) {
      logger.error("Missing captcha token");
      return { error: t("captchaRequired"), success: false };
    }

    if (!jobId || !companyId || !interviewId) {
      logger.error("Missing params", { jobId, companyId, interviewId });
      return { error: t("genericError"), success: false };
    }

    const user = await getServerUser();

    if (!user) {
      logger.error("No user found");
      return { error: t("genericError"), success: false };
    }

    // For anonymous users, use the email from user metadata
    const userEmail = user.new_email;
    if (!userEmail) {
      logger.error("No user email found");
      return { error: t("genericError"), success: false };
    }

    const origin = (await headers()).get("origin");
    const { error } = await supabase.auth.updateUser(
      {
        email: userEmail,
      },
      {
        emailRedirectTo: `${origin}/apply/company/${companyId}/job/${jobId}/candidate-interview/${interviewId}`,
      }
    );

    if (error) {
      logger.error("Failed to resend confirmation email", { error });
      throw error;
    }

    logger.info("Confirmation email resent successfully");
    return { success: true, error: null };
  } catch (error) {
    logger.error("Error in resendConfirmationEmail", { error });
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to resend confirmation email",
      success: false,
    };
  } finally {
    await logger.flush();
  }
};
