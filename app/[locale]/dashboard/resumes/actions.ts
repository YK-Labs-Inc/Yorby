"use server";

import { createSupabaseServerClient } from "@/utils/supabase/server";
import { ResumeDataType } from "./components/ResumeBuilder";
import { getTranslations } from "next-intl/server";
import { Logger } from "next-axiom";
import { Tables } from "@/utils/supabase/database.types";
import { revalidatePath } from "next/cache";
import { UploadResponse } from "@/utils/types";
import { GoogleAIFileManager } from "@google/generative-ai/server";

export async function saveResumeServerAction(
  prevState: { error?: string },
  data: FormData
) {
  const resumeId = data.get("resumeId") as string;
  const resume = JSON.parse(data.get("resume") as string) as ResumeDataType;
  return saveResume(resume, resumeId);
}

export const saveResume = async (resume: ResumeDataType, resumeId: string) => {
  const t = await getTranslations("resumeBuilder");
  const logger = new Logger().with({
    function: "saveResume",
  });
  let errorMessage = "";
  try {
    const supabase = await createSupabaseServerClient();

    const { resume_sections, ...baseResumeInfo } = resume;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      logger.error("User not authenticated");
      await logger.flush();
      return { error: t("errors.auth") };
    }

    const { error: resumeError } = await supabase
      .from("resumes")
      .update(baseResumeInfo)
      .eq("id", resumeId);

    if (resumeError) {
      logger.error("Error updating resume", { error: resumeError });
      await logger.flush();
      return { error: t("errors.resumeSaveError") };
    }
    await deleteResumeSections(resumeId);
    await insertNewResumeSections(resume_sections, resumeId);
    logger.info("Resume saved");
    await logger.flush();
  } catch (error) {
    logger.error("Error saving resume", { error });
    await logger.flush();
    errorMessage = t("errors.resumeSaveError");
  }
  revalidatePath(`/dashboard/resumes/${resumeId}`);
  return { error: errorMessage };
};

const insertNewResumeSections = async (
  sections: (Tables<"resume_sections"> & {
    resume_list_items: Tables<"resume_list_items">[];
    resume_detail_items: (Tables<"resume_detail_items"> & {
      resume_item_descriptions: Tables<"resume_item_descriptions">[];
    })[];
  })[],
  resumeId: string
) => {
  const t = await getTranslations("resumeBuilder");
  const logger = new Logger().with({
    sections,
    function: "insertNewResumeSections",
  });
  const supabase = await createSupabaseServerClient();
  await Promise.all(
    sections.map(async (section, index) => {
      const { resume_list_items, resume_detail_items } = section;
      const { data: resumeSection, error: resumeError } = await supabase
        .from("resume_sections")
        .insert({
          title: section.title,
          display_order: index,
          resume_id: resumeId,
        })
        .select("id")
        .single();
      if (resumeError) {
        logger.error("Error inserting resume sections", { error: resumeError });
        await logger.flush();
        throw new Error(t("errors.generic"));
      }
      if (resume_list_items.length > 0) {
        await saveResumeListItems(resume_list_items, resumeSection.id);
      }
      if (resume_detail_items.length > 0) {
        await saveResumeDetailItems(resume_detail_items, resumeSection.id);
      }
    })
  );
};

const saveResumeDetailItems = async (
  detailItems: (Tables<"resume_detail_items"> & {
    resume_item_descriptions: Tables<"resume_item_descriptions">[];
  })[],
  sectionId: string
) => {
  const t = await getTranslations("resumeBuilder");
  const supabase = await createSupabaseServerClient();
  const logger = new Logger().with({
    detailItems,
    function: "saveResumeDetailItem",
  });
  await Promise.all(
    detailItems.map(async (item, index) => {
      const { resume_item_descriptions, ...baseResumeDetailItem } = item;
      const { data: resumeDetailItem, error: resumeError } = await supabase
        .from("resume_detail_items")
        .insert({
          section_id: sectionId,
          title: item.title,
          subtitle: item.subtitle,
          date_range: item.date_range,
          display_order: index,
        })
        .select("id")
        .single();
      if (resumeError) {
        logger.error("Error inserting resume detail items", {
          error: resumeError,
        });
        await logger.flush();
        throw new Error(t("errors.generic"));
      }
      if (resume_item_descriptions.length > 0) {
        await saveResumeItemDescriptions(
          resume_item_descriptions,
          resumeDetailItem.id
        );
      }
    })
  );
};

const saveResumeItemDescriptions = async (
  itemDescriptions: Tables<"resume_item_descriptions">[],
  detailItemId: string
) => {
  const t = await getTranslations("resumeBuilder");
  const supabase = await createSupabaseServerClient();
  const logger = new Logger().with({
    itemDescriptions,
    function: "saveResumeItemDescription",
  });
  const { error: resumeError } = await supabase
    .from("resume_item_descriptions")
    .insert(
      itemDescriptions.map((item, index) => ({
        detail_item_id: detailItemId,
        display_order: index,
        description: item.description,
      }))
    );
  if (resumeError) {
    logger.error("Error inserting resume item descriptions", {
      error: resumeError,
    });
    await logger.flush();
    throw new Error(t("errors.generic"));
  }
};
const saveResumeListItems = async (
  items: Tables<"resume_list_items">[],
  sectionId: string
) => {
  const t = await getTranslations("resumeBuilder");
  const supabase = await createSupabaseServerClient();
  const logger = new Logger().with({
    items,
    function: "saveResumeListItem",
  });
  const { error: resumeError } = await supabase
    .from("resume_list_items")
    .insert(
      items.map((item, index) => ({
        content: item.content,
        section_id: sectionId,
        display_order: index,
      }))
    );
  if (resumeError) {
    logger.error("Error inserting resume list items", { error: resumeError });
    await logger.flush();
    throw new Error(t("errors.generic"));
  }
};

const deleteResumeSections = async (resumeId: string) => {
  const t = await getTranslations("resumeBuilder");
  const logger = new Logger().with({
    resumeId,
    function: "deleteResumeSections",
  });
  const supabase = await createSupabaseServerClient();
  const { error: resumeError } = await supabase
    .from("resume_sections")
    .delete()
    .eq("resume_id", resumeId);

  if (resumeError) {
    logger.error("Error deleting resume sections", { error: resumeError });
    await logger.flush();
    throw new Error(t("errors.generic"));
  }
};

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

export const fetchUserCredits = async (userId: string) => {
  const logger = new Logger().with({
    function: "fetchUserCredits",
    userId,
  });
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("custom_job_credits")
    .select("number_of_credits")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    logger.error("Error fetching user credits", { error });
    return 0;
  }
  return data?.number_of_credits || 0;
};

export const fetchHasSubscription = async (userId: string) => {
  const logger = new Logger().with({
    function: "fetchHasSubscription",
    userId,
  });
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    logger.error("Error fetching has subscription", { error });
    return false;
  }
  return data !== null;
};

export const fetchResume = async (resumeId: string) => {
  const logger = new Logger().with({
    function: "fetchResume",
    resumeId,
  });
  const supabase = await createSupabaseServerClient();
  const { data: resumeData, error: resumeError } = await supabase
    .from("resumes")
    .select("*")
    .eq("id", resumeId)
    .single();
  if (resumeError) {
    logger.error("Error fetching resume", { error: resumeError });
    return null;
  }
  return resumeData;
};

export async function verifyAnonymousUser(prevState: any, formData: FormData) {
  const captchaToken = formData.get("captchaToken") as string;
  const currentPath = formData.get("currentPath") as string;
  const supabase = await createSupabaseServerClient();
  const t = await getTranslations("resumeBuilder");
  const logger = new Logger().with({
    function: "verifyAnonymousUser",
    captchaToken,
  });
  const { data, error } = await supabase.auth.signInAnonymously({
    options: {
      captchaToken,
    },
  });

  if (error || !data) {
    logger.error("Error verifying anonymous user", { error });
    await logger.flush();
    return { error: t("errors.generic") };
  } else {
    revalidatePath(currentPath);
  }
}

export const trackResumeEdit = async (resumeId: string) => {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("resume_edits")
    .insert({ resume_id: resumeId });

  if (error) {
    const logger = new Logger().with({
      function: "trackResumeEdit",
      resumeId,
    });
    logger.error("Error tracking resume edit", { error });
    await logger.flush();
  }
};

export const getResumeEditCount = async (resumeId: string) => {
  const supabase = await createSupabaseServerClient();
  const { count, error } = await supabase
    .from("resume_edits")
    .select("*", { count: "exact", head: true })
    .eq("resume_id", resumeId);

  if (error) {
    const logger = new Logger().with({
      function: "trackResumeEdit",
      resumeId,
    });
    logger.error("Error getting resume edit count:", { error });
    await logger.flush();
    return 0;
  }

  return count || 0;
};

export async function uploadResumeFile(file: File, userId: string) {
  const supabase = await createSupabaseServerClient();

  // Upload to Supabase storage
  const fileName = `${new Date().getTime()}.${file.type.split("/")[1]}`;
  const filePath = `${userId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("user-files")
    .upload(filePath, file);

  if (uploadError) {
    throw uploadError;
  }

  // Upload to Gemini
  const blob = new Blob([file], { type: file.type });
  const formData = new FormData();
  const metadata = {
    file: { mimeType: file.type, displayName: fileName },
  };
  formData.append(
    "metadata",
    new Blob([JSON.stringify(metadata)], { type: "application/json" })
  );
  formData.append("file", blob);

  const geminiResponse = await fetch(
    `https://generativelanguage.googleapis.com/upload/v1beta/files?uploadType=multipart&key=${process.env.GOOGLE_GENERATIVE_AI_API_KEY}`,
    { method: "post", body: formData }
  );

  if (!geminiResponse.ok) {
    // If Gemini upload fails, clean up the Supabase file
    await supabase.storage.from("user-files").remove([filePath]);
    throw new Error(`Failed to upload to Gemini: ${geminiResponse.statusText}`);
  }

  const geminiUploadResponse = (await geminiResponse.json()) as UploadResponse;

  // Get the Supabase file URL
  const {
    data: { publicUrl: fileUri },
  } = supabase.storage.from("user-files").getPublicUrl(filePath);

  // Insert into user_files table with Gemini information
  const { error: dbError } = await supabase.from("user_files").insert({
    user_id: userId,
    file_path: filePath,
    bucket_name: "user-files",
    mime_type: file.type,
    google_file_name: geminiUploadResponse.file.name,
    google_file_uri: geminiUploadResponse.file.uri,
    display_name: file.name,
  });

  if (dbError) {
    // If DB insert fails, clean up both uploaded files
    await supabase.storage.from("user-files").remove([filePath]);
    // Note: Gemini files are automatically cleaned up after their expiration time
    throw dbError;
  }
}

export async function deleteResumeFile(fileId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const logger = new Logger().with({
    fileId,
    function: "deleteResumeFile",
  });

  try {
    // First fetch the file details
    const { data: file, error: fetchError } = await supabase
      .from("user_files")
      .select("*")
      .eq("id", fileId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    // Delete from Supabase storage
    const { error: storageError } = await supabase.storage
      .from("user-files")
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
      .from("user_files")
      .delete()
      .eq("id", fileId);

    if (dbError) {
      throw dbError;
    }

    logger.info("File deleted successfully");
    return { success: true };
  } catch (error: any) {
    logger.error("Error deleting file", { error: error.message });
    return { error: "Failed to delete file" };
  } finally {
    await logger.flush();
  }
}
