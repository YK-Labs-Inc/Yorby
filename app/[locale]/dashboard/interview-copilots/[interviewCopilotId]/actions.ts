"use server";
import { uploadFileToGemini } from "@/app/[locale]/landing2/actions";
import { Tables } from "@/utils/supabase/database.types";
import {
  createSupabaseServerClient,
  downloadFile,
} from "@/utils/supabase/server";
import { UploadResponse } from "@/utils/types";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { Logger } from "next-axiom";
import { getTranslations } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Initialize both models
const answerModel = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: {
      type: SchemaType.OBJECT,
      properties: {
        answer: { type: SchemaType.STRING },
      },
      required: ["answer"],
    },
  },
});

export const generateCopilotAnswer = async (data: FormData) => {
  const interviewCopilotId = data.get("copilotId") as string;
  const interviewCopilot = await fetchInterviewCopilot(interviewCopilotId);
};

const fetchInterviewCopilot = async (interviewCopilotId: string) => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("interview_copilots")
    .select("*, interview_copilot_files(*)")
    .eq("id", interviewCopilotId)
    .single();
  if (error) {
    throw error;
  }
  return data;
};

export const startInterviewCopilot = async (prevState: any, data: FormData) => {
  const interviewCopilotId = data.get("interviewCopilotId") as string;
  const logger = new Logger().with({
    function: "startInterviewCopilot",
    interviewCopilotId,
  });
  try {
    logger.info("Starting interview copilot");
    await getAllInterviewCopilotFiles(interviewCopilotId);
    logger.info("Interview copilot started");
    await logger.flush();
    return { success: true };
  } catch (error) {
    logger.error("Error starting interview copilot", { error });
    await logger.flush();
    const t = await getTranslations("");
    return { error: t("errors.pleaseTryAgain") };
  }
};

const getAllInterviewCopilotFiles = async (interviewCopilotId: string) => {
  const interviewCopilot = await fetchInterviewCopilot(interviewCopilotId);
  const fileStatuses = await Promise.all(
    interviewCopilot.interview_copilot_files.map(checkFileExists)
  );
  return await Promise.all(
    fileStatuses.map(async ({ file, status }) => {
      if (!status) {
        const uploadResponse = await processMissingFile({ file });
        return {
          fileData: {
            fileUri: uploadResponse.file.uri,
            mimeType: uploadResponse.file.mimeType,
          },
        };
      }
      return {
        fileData: {
          fileUri: file.google_file_uri,
          mimeType: file.mime_type,
        },
      };
    })
  );
};

const checkFileExists = async (file: Tables<"interview_copilot_files">) => {
  try {
    const fileManager = new GoogleAIFileManager(GEMINI_API_KEY);
    await fileManager.getFile(file.google_file_name);
    return { file, status: true };
  } catch {
    return { file, status: false };
  }
};

const processMissingFile = async ({
  file,
}: {
  file: Tables<"interview_copilot_files">;
}) => {
  const { file_path } = file;
  const display_name = file_path.split("/").pop()!;
  const data = await downloadFile({
    filePath: file_path,
    bucket: "interview_copilot_files",
  });
  const uploadResponse = await uploadFileToGemini({
    blob: data,
    displayName: display_name,
  });
  await updateFileInDatabase({
    uploadResponse,
    fileId: file.id,
  });
  return uploadResponse;
};

const updateFileInDatabase = async ({
  uploadResponse,
  fileId,
}: {
  uploadResponse: UploadResponse;
  fileId: string;
}) => {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("interview_copilot_files")
    .update({
      google_file_uri: uploadResponse.file.uri,
      google_file_name: uploadResponse.file.name,
    })
    .eq("id", fileId);
  if (error) {
    throw error;
  }
};

export const uploadInterviewCopilotFile = async (
  prevState: any,
  formData: FormData
) => {
  const file = formData.get("file") as File;
  const interviewCopilotId = formData.get("interviewCopilotId") as string;
  const t = await getTranslations("interviewCopilots");

  const logger = new Logger().with({
    function: "uploadInterviewCopilotFile",
    interviewCopilotId,
  });

  if (!file) {
    logger.error("No file provided");
    await logger.flush();
    return { error: t("errors.fileRequired") };
  }

  if (!interviewCopilotId) {
    logger.error("No interview copilot ID provided");
    await logger.flush();
    return { error: t("errors.generic") };
  }

  if (file.type !== "application/pdf") {
    logger.error("File is not a PDF");
    await logger.flush();
    return { error: t("errors.pdfOnly") };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      logger.error("User not authenticated");
      await logger.flush();
      return { error: t("errors.generic") };
    }

    // Upload file to storage
    const filePath = `${user.id}/${interviewCopilotId}/${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("interview_copilot_files")
      .upload(filePath, file, {
        upsert: true,
      });

    if (uploadError) {
      logger.error("Failed to upload file", { error: uploadError });
      await logger.flush();
      return { error: t("errors.generic") };
    }

    // Create file entry in database
    const { error: dbError } = await supabase
      .from("interview_copilot_files")
      .insert({
        interview_copilot_id: interviewCopilotId,
        file_path: filePath,
        google_file_name: file.name,
        google_file_uri: "", // We're not using Google's file storage in this case
        mime_type: file.type,
      });

    if (dbError) {
      logger.error("Failed to create file entry", { error: dbError });
      await logger.flush();
      return { error: t("errors.generic") };
    }

    logger.info("File uploaded successfully");
    await logger.flush();

    // Revalidate the page to show the new file
    revalidatePath(`/dashboard/interview-copilots/${interviewCopilotId}`);
    return { success: true };
  } catch (error) {
    logger.error("Error uploading file", { error });
    await logger.flush();
    return { error: t("errors.generic") };
  }
};

export const deleteInterviewCopilotFile = async (
  prevState: any,
  formData: FormData
) => {
  const fileId = formData.get("fileId") as string;
  const interviewCopilotId = formData.get("interviewCopilotId") as string;
  const t = await getTranslations("interviewCopilots");

  if (!fileId || !interviewCopilotId) {
    return { error: t("errors.generic") };
  }

  const logger = new Logger().with({
    function: "deleteInterviewCopilotFile",
    fileId,
    interviewCopilotId,
  });

  try {
    const supabase = await createSupabaseServerClient();

    // First get the file details to know what to delete from storage
    const { data: file, error: fetchError } = await supabase
      .from("interview_copilot_files")
      .select("file_path")
      .eq("id", fileId)
      .single();

    if (fetchError) {
      logger.error("Failed to fetch file details", { error: fetchError });
      await logger.flush();
      return { error: "Failed to delete file" };
    }

    // Delete from storage first
    if (file.file_path) {
      const { error: storageError } = await supabase.storage
        .from("interview_copilot_files")
        .remove([file.file_path]);

      if (storageError) {
        logger.error("Failed to delete file from storage", {
          error: storageError,
        });
        await logger.flush();
        return { error: t("errors.generic") };
      }
    }

    // Then delete from database
    const { error: dbError } = await supabase
      .from("interview_copilot_files")
      .delete()
      .eq("id", fileId);

    if (dbError) {
      logger.error("Failed to delete file from database", { error: dbError });
      await logger.flush();
      return { error: t("errors.generic") };
    }

    logger.info("File deleted successfully");
    await logger.flush();

    // Revalidate the page to update the file list
    revalidatePath(`/dashboard/interview-copilots/${interviewCopilotId}`);
    return { success: true };
  } catch (error) {
    logger.error("Error deleting file", { error });
    await logger.flush();
    return { error: t("errors.generic") };
  }
};

export const updateInterviewCopilot = async (
  prevState: any,
  formData: FormData
) => {
  const t = await getTranslations("interviewCopilots");
  const logger = new Logger().with({
    function: "updateInterviewCopilot",
  });

  try {
    const supabase = await createSupabaseServerClient();
    const interviewCopilotId = formData.get("id") as string;
    const title = formData.get("title") as string;
    const jobTitle = formData.get("job_title") as string;
    const jobDescription = formData.get("job_description") as string;
    const companyName = formData.get("company_name") as string;
    const companyDescription = formData.get("company_description") as string;

    const { error } = await supabase
      .from("interview_copilots")
      .update({
        title: title,
        job_title: jobTitle || null,
        job_description: jobDescription || null,
        company_name: companyName || null,
        company_description: companyDescription || null,
      })
      .eq("id", interviewCopilotId);

    if (error) throw error;

    logger.info("Interview copilot updated successfully");
    await logger.flush();

    revalidatePath(`/dashboard/interview-copilots/${interviewCopilotId}`);
    return { success: true };
  } catch (error) {
    logger.error("Error updating interview copilot", { error });
    await logger.flush();
    return { error: t("edit.saveError") };
  }
};

export const deleteInterviewCopilot = async (
  prevState: any,
  formData: FormData
) => {
  const t = await getTranslations("interviewCopilots.errors");
  const supabase = await createSupabaseServerClient();
  const logger = new Logger().with({
    function: "deleteInterviewCopilot",
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    logger.error("User not authenticated");
    await logger.flush();
    return { error: t("generic") };
  }

  const interviewCopilotId = formData.get("id") as string;

  if (!interviewCopilotId) {
    logger.error("No interview copilot ID provided");
    await logger.flush();
    return { error: t("generic") };
  }

  try {
    const { error: updateError } = await supabase
      .from("interview_copilots")
      .update({
        deletion_status: "deleted",
      })
      .eq("id", interviewCopilotId)
      .eq("user_id", user.id);

    if (updateError) {
      logger.error("Failed to delete interview copilot", {
        error: updateError,
      });
      await logger.flush();
      return { error: t("generic") };
    }

    logger.info("Interview copilot deleted", {
      interviewCopilotId,
    });
    await logger.flush();
  } catch (error) {
    logger.error("Failed to delete interview copilot", {
      error,
    });
    await logger.flush();
    return { error: t("generic") };
  }

  revalidatePath("/dashboard/interview-copilots");
  redirect("/dashboard/interview-copilots");
};
