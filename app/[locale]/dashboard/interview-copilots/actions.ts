"use server";

import { getTranslations } from "next-intl/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Logger } from "next-axiom";
import { redirect } from "next/navigation";
import { uploadFileToGemini } from "@/app/[locale]/landing2/actions";
import { UploadResponse } from "@/utils/types";
export const createInterviewCopilot = async (
  prevState: any,
  formData: FormData
) => {
  const t = await getTranslations("interviewCopilots.errors");
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: t("generic") };
  }

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
        user_id: user.id,
        duration_ms: 0,
        input_tokens_count: 0,
        output_tokens_count: 0,
        transcript: "",
        title: title,
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
    logger.info("Interview copilot session created", {
      sessionId: sessionData.id,
    });

    // Upload files and create file entries
    for (const file of files) {
      const fileName = `${user.id}/${sessionData.id}/${file.name}`;
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
    copilotId = sessionData.id;
    await logger.flush();
  } catch (error) {
    logger.error("Failed to create interview copilot", {
      error: error,
    });
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
  redirect(`/dashboard/interview-copilots/sessions/${copilotId}`);
};

const generateJobTitle = async ({
  jobTitle,
  companyName,
}: {
  jobTitle: string | null;
  companyName: string | null;
}) => {
  const t = await getTranslations("interviewCopilots");
  if (!jobTitle && !companyName) {
    return `${new Date().toLocaleString()} ${t("jobTitle.label")} `;
  }
  return `${companyName
    ?.split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")} ${jobTitle
    ?.split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")} ${t("jobTitle.label")} `;
};
