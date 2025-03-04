"use server";

import { createSupabaseServerClient } from "@/utils/supabase/server";
import { ResumeDataType } from "./components/ResumeBuilder";
import { revalidatePath } from "next/cache";
import type { Message } from "@/components/form-message";
import { getTranslations } from "next-intl/server";
import { Logger } from "next-axiom";

type ResumeListItem = {
  section_id: string;
  content: string;
  display_order: number;
};

export async function saveResume(
  prevState: { error?: string },
  data: FormData
) {
  const t = await getTranslations("resumeBuilder");
  const resumeId = data.get("resumeId") as string;
  const resume = JSON.parse(data.get("resume") as string) as ResumeDataType;
  const logger = new Logger().with({
    resumeId,
    resume: JSON.stringify(resume),
  });
  try {
    const supabase = await createSupabaseServerClient();

    // Start a Supabase transaction
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      logger.error("User not authenticated");
      await logger.flush();
      return { error: t("errors.auth") };
    }

    // 1. Update the resume basic info
    const { error: resumeError } = await supabase
      .from("resumes")
      .update({
        name: resume.name,
        email: resume.email,
        phone: resume.phone,
        location: resume.location,
        summary: resume.summary,
        updated_at: new Date().toISOString(),
      })
      .eq("id", resumeId);

    if (resumeError) {
      logger.error("Error updating resume", { error: resumeError });
      await logger.flush();
      return { error: t("errors.resumeSaveError") };
    }

    // 2. Get existing sections to handle deletions
    const { data: existingSections } = await supabase
      .from("resume_sections")
      .select("id, title")
      .eq("resume_id", resumeId);

    // 3. Process each section
    for (let i = 0; i < resume.sections.length; i++) {
      const section = resume.sections[i];

      // Find or create section
      const { data: sectionData, error: sectionError } = await supabase
        .from("resume_sections")
        .upsert({
          resume_id: resumeId,
          title: section.title,
          display_order: i,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (sectionError || !sectionData) {
        logger.error("Error creating section", { error: sectionError });
        await logger.flush();
        return { error: t("errors.resumeSaveError") };
      }

      // Handle section content based on type
      if (
        Array.isArray(section.content) &&
        typeof section.content[0] === "string"
      ) {
        // Skills section - handle as list items
        // First, delete existing list items for this section
        await supabase
          .from("resume_list_items")
          .delete()
          .eq("section_id", sectionData.id);

        // Insert new list items
        const listItems: ResumeListItem[] = (section.content as string[]).map(
          (content, index) => ({
            section_id: sectionData.id,
            content: content,
            display_order: index,
          })
        );

        const { error: listError } = await supabase
          .from("resume_list_items")
          .insert(listItems);

        if (listError) {
          logger.error("Error saving list items", { error: listError });
          await logger.flush();
          return { error: t("errors.resumeSaveError") };
        }
      } else {
        // Detail items section
        const detailItems = section.content as unknown as Array<{
          title: string;
          subtitle: string;
          date: string | null;
          description: string[];
          id?: string;
        }>;

        // Get existing detail items to handle deletions
        const { data: existingDetailItems } = await supabase
          .from("resume_detail_items")
          .select("id")
          .eq("section_id", sectionData.id);

        // Process each detail item
        for (let j = 0; j < detailItems.length; j++) {
          const item = detailItems[j];

          // Create or update detail item
          const { data: detailItemData, error: detailError } = await supabase
            .from("resume_detail_items")
            .upsert({
              section_id: sectionData.id,
              title: item.title,
              subtitle: item.subtitle,
              date_range: item.date,
              display_order: j,
              updated_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (detailError || !detailItemData) {
            logger.error("Error saving detail item", { error: detailError });
            await logger.flush();
            return { error: t("errors.resumeSaveError") };
          }

          // Delete existing descriptions
          await supabase
            .from("resume_item_descriptions")
            .delete()
            .eq("detail_item_id", detailItemData.id);

          // Insert new descriptions
          if (item.description.length > 0) {
            const descriptions = item.description.map((desc, index) => ({
              detail_item_id: detailItemData.id,
              description: desc,
              display_order: index,
            }));

            const { error: descError } = await supabase
              .from("resume_item_descriptions")
              .insert(descriptions);

            if (descError) {
              logger.error("Error saving descriptions", { error: descError });
              await logger.flush();
              return { error: t("errors.resumeSaveError") };
            }
          }
        }

        // Delete removed detail items
        if (existingDetailItems) {
          const currentDetailItemIds = detailItems
            .map((item) => item.id)
            .filter((id): id is string => id !== undefined);
          const removedDetailItemIds = existingDetailItems
            .map((item) => item.id)
            .filter((id) => !currentDetailItemIds.includes(id));

          if (removedDetailItemIds.length > 0) {
            await supabase
              .from("resume_detail_items")
              .delete()
              .in("id", removedDetailItemIds);
          }
        }
      }
    }

    // Delete removed sections
    if (existingSections) {
      const currentSectionIds = resume.sections
        .map((section) => (section as any).id)
        .filter((id): id is string => id !== undefined);
      const removedSectionIds = existingSections
        .map((section) => section.id)
        .filter((id) => !currentSectionIds.includes(id));

      if (removedSectionIds.length > 0) {
        await supabase
          .from("resume_sections")
          .delete()
          .in("id", removedSectionIds);
      }
    }
    return { error: "" };
  } catch (error) {
    logger.error("Error saving resume", { error });
    await logger.flush();
    return { error: t("errors.resumeSaveError") };
  }
}
