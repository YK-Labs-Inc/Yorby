"use server";

import { createSupabaseServerClient } from "@/utils/supabase/server";
import { getServerUser } from "@/utils/auth/server";
import { UploadResponse } from "@/utils/types";
import { Logger } from "next-axiom";
import { getTranslations } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { GoogleAIFileManager } from "@google/generative-ai/server";

export const uploadAdditionalFiles = async ({
  jobId,
  files,
}: {
  jobId: string;
  files: File[];
}) => {
  const supabase = await createSupabaseServerClient();
  const user = await getServerUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const trackingProperties = {
    jobId,
    numberOfFiles: files.length,
    function: "uploadAdditionalFiles",
  };
  const logger = new Logger().with(trackingProperties);
  const t = await getTranslations("errors");

  try {
    logger.info("Starting to upload additional files");

    await Promise.all(
      files.map((file) =>
        processFile({
          file,
          displayName: file.name,
          customJobId: jobId,
          userId: user.id,
        })
      )
    );

    logger.info("Files uploaded successfully");
  } catch (error: any) {
    logger.error("Error uploading files", { error: error.message });
    return { error: t("pleaseTryAgain") };
  } finally {
    await logger.flush();
  }
  revalidatePath(`/dashboard/jobs/${jobId}/files`);
  redirect(
    `/dashboard/jobs/${jobId}/files?success=Files uploaded successfully`
  );
};

const processFile = async ({
  file,
  displayName,
  customJobId,
  userId,
}: {
  file: File;
  displayName: string;
  customJobId: string;
  userId: string;
}) => {
  const filePath = await uploadFileToSupabase({ file, customJobId, userId });
  return await uploadFileToGemini({ file, displayName, customJobId, filePath });
};

const uploadFileToSupabase = async ({
  file,
  customJobId,
  userId,
}: {
  file: File;
  customJobId: string;
  userId: string;
}) => {
  const supabase = await createSupabaseServerClient();
  const filePath = `${userId}/${customJobId}/${new Date().getTime()}.${file.name.split(".").pop()}`;
  const { error } = await supabase.storage
    .from("custom_job_files")
    .upload(filePath, file);
  if (error) {
    throw error;
  }
  return filePath;
};

const uploadFileToGemini = async ({
  file,
  displayName,
  customJobId,
  filePath,
}: {
  file: File;
  displayName: string;
  customJobId: string;
  filePath: string;
}) => {
  const blob = new Blob([file], { type: file.type });
  const formData = new FormData();
  const metadata = {
    file: { mimeType: file.type, displayName: displayName },
  };
  formData.append(
    "metadata",
    new Blob([JSON.stringify(metadata)], { type: "application/json" })
  );
  formData.append("file", blob);
  const res2 = await fetch(
    `https://generativelanguage.googleapis.com/upload/v1beta/files?uploadType=multipart&key=${process.env.GOOGLE_GENERATIVE_AI_API_KEY}`,
    { method: "post", body: formData }
  );
  const geminiUploadResponse = (await res2.json()) as UploadResponse;
  await writeToDb(geminiUploadResponse, customJobId, filePath);
  return geminiUploadResponse;
};

const writeToDb = async (
  uploadResponse: UploadResponse,
  customJobId: string,
  filePath: string
) => {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("custom_job_files").insert({
    display_name: uploadResponse.file.displayName,
    file_path: filePath,
    google_file_name: uploadResponse.file.name,
    google_file_uri: uploadResponse.file.uri,
    mime_type: uploadResponse.file.mimeType,
    custom_job_id: customJobId,
  });
  if (error) {
    throw error;
  }
};

export const deleteFile = async (fileId: string) => {
  const supabase = await createSupabaseServerClient();
  const user = await getServerUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const logger = new Logger().with({
    fileId,
    function: "deleteFile",
  });
  const t = await getTranslations("errors");

  try {
    // First fetch the file details
    const { data: file, error: fetchError } = await supabase
      .from("custom_job_files")
      .select("*")
      .eq("id", fileId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    // Delete from Supabase storage
    const { error: storageError } = await supabase.storage
      .from("custom_job_files")
      .remove([file.file_path]);

    if (storageError) {
      throw storageError;
    }

    // Try to delete from Gemini AI
    try {
      const fileManager = new GoogleAIFileManager(
        process.env.GOOGLE_GENERATIVE_AI_API_KEY!
      );
      await fileManager.deleteFile(file.google_file_name);
    } catch (error) {
      // Log but don't fail if Gemini deletion fails
      logger.warn("Failed to delete file from Gemini", { error });
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from("custom_job_files")
      .delete()
      .eq("id", fileId);

    if (dbError) {
      throw dbError;
    }

    logger.info("File deleted successfully");
    revalidatePath(`/dashboard/jobs/${file.custom_job_id}/files`);
    return { success: true };
  } catch (error: any) {
    logger.error("Error deleting file", { error: error.message });
    return { error: t("pleaseTryAgain") };
  } finally {
    await logger.flush();
  }
};
