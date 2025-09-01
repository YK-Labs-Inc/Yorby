"use server";

import { getTranslations } from "next-intl/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { getServerUser } from "@/utils/auth/server";
import { Logger } from "next-axiom";
import { redirect } from "next/navigation";
import { UploadResponse } from "@/utils/types";
import { INTERVIEW_COPILOT_REQUIRED_CREDITS } from "@/app/constants/interview_copilots";
import { uploadFileToGemini } from "@/utils/ai/gemini";

export const createInterviewCopilot = async (
  prevState: any,
  formData: FormData
) => {
  const t = await getTranslations("interviewCopilots.errors");
  const supabase = await createSupabaseServerClient();
  const captchaToken = formData.get("captchaToken") as string;
  let userId = "";

  const loggedInUser = await getServerUser();
  if (!loggedInUser) {
    const { data, error } = await supabase.auth.signInAnonymously({
      options: {
        captchaToken,
      },
    });
    if (error) {
      throw error;
    }
    if (!data.user?.id) {
      throw new Error("User ID not found");
    }
    userId = data.user?.id;
  } else {
    userId = loggedInUser.id;
  }

  if (!userId) {
    return { error: t("generic") };
  }

  // Check user credits
  const { data: credits } = await supabase
    .from("custom_job_credits")
    .select("number_of_credits")
    .eq("id", userId)
    .single();

  const hasCredits =
    credits && credits.number_of_credits >= INTERVIEW_COPILOT_REQUIRED_CREDITS;

  let copilotId;

  const jobTitle = (formData.get("jobTitle") as string) || null;
  const jobDescription = (formData.get("jobDescription") as string) || null;
  const companyName = (formData.get("companyName") as string) || null;
  const companyDescription =
    (formData.get("companyDescription") as string) || null;
  const files = formData.getAll("files") as File[];
  const logger = new Logger().with({
    jobTitle,
    jobDescription,
    companyName,
    companyDescription,
    files: files.length,
    function: "createInterviewCopilot",
  });

  logger.info("Creating interview copilot session");
  try {
    const title = await generateJobTitle({
      jobTitle,
      companyName,
    });
    // Create interview copilot session
    const { data: sessionData, error: sessionError } = await supabase
      .from("interview_copilots")
      .insert({
        job_title: jobTitle,
        job_description: jobDescription,
        company_name: companyName,
        company_description: companyDescription,
        user_id: userId,
        duration_ms: 0,
        input_tokens_count: 0,
        output_tokens_count: 0,
        transcript: "",
        title: title,
        status: "in_progress",
        deletion_status: "not_deleted",
        interview_copilot_access: hasCredits ? "unlocked" : "locked",
      })
      .select()
      .single();

    if (sessionError) {
      logger.error("Failed to create interview copilot session", {
        error: sessionError,
      });
      await logger.flush();
      return { error: t("generic") };
    }
    copilotId = sessionData.id;
    logger.info("Interview copilot session created", {
      sessionId: sessionData.id,
    });

    // Only deduct credit if user has sufficient credits
    if (hasCredits) {
      const { error: creditError } = await supabase
        .from("custom_job_credits")
        .update({
          number_of_credits:
            credits.number_of_credits - INTERVIEW_COPILOT_REQUIRED_CREDITS,
        })
        .eq("id", userId);

      if (creditError) {
        // If credit deduction fails, delete the created session
        await supabase
          .from("interview_copilots")
          .delete()
          .eq("id", sessionData.id);
        logger.error("Failed to deduct credit", {
          error: creditError,
        });
        await logger.flush();
        return { error: t("generic") };
      }
    }

    // Upload files and create file entries
    for (const file of files) {
      const fileName = `${userId}/${sessionData.id}/${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("interview_copilot_files")
        .upload(fileName, file, {
          upsert: true,
        });

      if (uploadError) {
        logger.error("Failed to upload interview copilot file", {
          error: uploadError,
        });
        await logger.flush();
        return { error: t("uploadFailed") };
      }

      let uploadResponse: UploadResponse;
      try {
        const blob = new Blob([file], { type: file.type });
        uploadResponse = await uploadFileToGemini({
          blob,
          displayName: file.name,
        });
      } catch (error) {
        logger.error("Failed to upload interview copilot file to Gemini", {
          error: error,
        });
        await logger.flush();
        return { error: t("uploadFailed") };
      }

      const { error: fileError } = await supabase
        .from("interview_copilot_files")
        .insert({
          interview_copilot_id: sessionData.id,
          file_path: fileName,
          mime_type: uploadResponse.file.mimeType,
          google_file_name: uploadResponse.file.name,
          google_file_uri: uploadResponse.file.uri,
        });

      if (fileError) {
        logger.error("Failed to create interview copilot file", {
          error: fileError,
        });
        await logger.flush();
        return { error: t("generic") };
      }
    }
    logger.info("Interview copilot created", {
      sessionId: sessionData.id,
    });
    await logger.flush();
  } catch (error) {
    logger.error("Failed to create interview copilot", {
      error: error,
    });
    if (copilotId) {
      await supabase.from("interview_copilots").delete().eq("id", copilotId);
      logger.info("Deleted interview copilot due to error", {
        copilotId,
      });
    }
    await logger.flush();
    return { error: t("generic") };
  }
  if (!copilotId) {
    logger.error("Failed to create interview copilot", {
      error: "No copilot ID",
    });
    await logger.flush();
    return { error: t("generic") };
  }
  redirect(`/dashboard/interview-copilots/${copilotId}`);
};

const generateJobTitle = async ({
  jobTitle,
  companyName,
}: {
  jobTitle: string | null;
  companyName: string | null;
}) => {
  const t = await getTranslations("interviewCopilots");

  if (jobTitle && companyName) {
    return `${companyName
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")} ${jobTitle
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")} ${t("jobCreation.title")} `;
  }

  if (jobTitle && !companyName) {
    return `${jobTitle
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")} ${t("jobCreation.title")} `;
  }

  if (!jobTitle && companyName) {
    return `${companyName
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")} ${t("jobCreation.title")} `;
  }
  return `${new Date().toLocaleString()} ${t("jobCreation.title")} `;
};
