"use server";

import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Logger } from "next-axiom";

export async function ensureCoachExists(userId: string, displayName: string) {
  const supabase = await createSupabaseServerClient();
  const logger = new Logger().with({ userId, displayName });

  try {
    // Check if coach already exists
    const { data: existingCoach } = await supabase
      .from("coaches")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (existingCoach) {
      logger.info("Coach already exists", { coachId: existingCoach.id });
      await logger.flush();
      return { success: true, coachId: existingCoach.id };
    }

    // Generate a unique slug from the display name
    const baseSlug = displayName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    let slug = baseSlug;
    let counter = 1;

    // Check if slug is already taken and generate a unique one
    while (true) {
      const { data: existingSlug } = await supabase
        .from("coaches")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (!existingSlug) break;

      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create coach entry
    const { data: newCoach, error: createError } = await supabase
      .from("coaches")
      .insert({
        user_id: userId,
        name: displayName,
        slug: slug,
      })
      .select("id")
      .single();

    if (createError) {
      logger.error("Failed to create coach", { error: createError });
      await logger.flush();
      return { success: false, error: createError.message };
    }

    logger.info("Coach created successfully", { coachId: newCoach.id });
    await logger.flush();
    return { success: true, coachId: newCoach.id };
  } catch (error) {
    logger.error("Unexpected error in ensureCoachExists", { error });
    await logger.flush();
    return { success: false, error: "Failed to create coach entry" };
  }
}
