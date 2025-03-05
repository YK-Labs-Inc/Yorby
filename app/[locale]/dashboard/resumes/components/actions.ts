"use server";

import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Logger } from "next-axiom";
import { getTranslations } from "next-intl/server";
import { revalidatePath } from "next/cache";

export const unlockResume = async (prevState: any, formData: FormData) => {
  const t = await getTranslations("resumeBuilder");
  const resumeId = formData.get("resumeId") as string;
  const logger = new Logger().with({
    function: "unlockResume",
    resumeId,
  });
  const supabase = await createSupabaseServerClient();

  // First check if resume is already unlocked
  const { data: resume, error: resumeError } = await supabase
    .from("resumes")
    .select("locked_status")
    .eq("id", resumeId)
    .single();

  if (resumeError) {
    logger.error("Error checking resume status", { error: resumeError });
    await logger.flush();
    return { error: t("errors.generic") };
  }

  // Get user's current credits
  const { data: credits, error: creditsError } = await supabase
    .from("custom_job_credits")
    .select("number_of_credits, id")
    .single();

  if (creditsError) {
    logger.error("Error checking credits", { error: creditsError });
    await logger.flush();
    return { error: t("errors.generic") };
  }

  if (!credits || credits.number_of_credits < 1) {
    logger.error("Insufficient credits");
    await logger.flush();
    return { error: t("errors.insufficientCredits") };
  }

  // Update resume status
  const { error: resumeUpdateError } = await supabase
    .from("resumes")
    .update({ locked_status: "unlocked" })
    .eq("id", resumeId);

  if (resumeUpdateError) {
    logger.error("Error updating resume", { error: resumeUpdateError });
    await logger.flush();
    await supabase
      .from("resumes")
      .update({ locked_status: "locked" })
      .eq("id", resumeId);
    return { error: t("errors.generic") };
  }

  // Deduct credit
  const { error: creditUpdateError } = await supabase
    .from("custom_job_credits")
    .update({ number_of_credits: credits.number_of_credits - 1 })
    .eq("id", credits.id);

  if (creditUpdateError) {
    logger.error("Error updating credits", { error: creditUpdateError });
    await supabase
      .from("resumes")
      .update({ locked_status: "locked" })
      .eq("id", resumeId);
    return { error: t("errors.generic") };
  }

  return { success: t("success.resumeUnlock") };
};
