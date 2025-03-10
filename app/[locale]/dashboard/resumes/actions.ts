"use server";

import { createSupabaseServerClient } from "@/utils/supabase/server";
import { ResumeDataType } from "./components/ResumeBuilder";
import { getTranslations } from "next-intl/server";
import { Logger } from "next-axiom";
import { Tables } from "@/utils/supabase/database.types";
import { redirect } from "next/navigation";

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
    return { error: "" };
  } catch (error) {
    logger.error("Error saving resume", { error });
    await logger.flush();
    return { error: t("errors.resumeSaveError") };
  }
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
  const supabase = await createSupabaseServerClient();
  const t = await getTranslations("resumeBuilder");
  const logger = new Logger().with({
    function: "verifyAnonymousUser",
    captchaToken,
  });
  try {
    const { data, error } = await supabase.auth.signInAnonymously({
      options: {
        captchaToken,
      },
    });

    if (error || !data) {
      logger.error("Error verifying anonymous user", { error });
      await logger.flush();
      return { error: t("errors.generic") };
    }
  } catch (error) {
    logger.error("Error verifying anonymous user", { error });
    await logger.flush();
    return { error: t("errors.generic") };
  }
  redirect("/dashboard/resumes");
}
