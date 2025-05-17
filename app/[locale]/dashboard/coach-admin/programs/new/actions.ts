"use server";

import { createSupabaseServerClient } from "@/utils/supabase/server";
import { validateCoach } from "../actions";
import { Logger } from "next-axiom";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createCustomJob(
    formData: FormData,
) {
    const supabase = await createSupabaseServerClient();
    let logger = new Logger().with({ function: "createCustomJob" });

    // Validate coach
    const coach = await validateCoach();
    if (!coach) {
        logger.error(
            "Unauthorized: You must be a coach to perform this action",
        );
        await logger.flush();
        return {
            success: false,
            message: "Unauthorized: You must be a coach to perform this action",
        };
    }

    // Extract form data
    const title = formData.get("title") as string;

    logger = logger.with({ title });

    // Validate required fields
    if (!title) {
        logger.error("Title and description are required");
        await logger.flush();
        return {
            success: false,
            message: "Title is required",
        };
    }

    // Create the custom job
    const { data, error } = await supabase
        .from("custom_jobs")
        .insert({
            job_title: title,
            user_id: coach.userId,
            coach_id: coach.coachId,
            status: "unlocked",
        })
        .select()
        .single();

    if (error) {
        logger.error("Error creating custom job:", error);
        await logger.flush();
        return {
            success: false,
            message: "Failed to create job: " + error.message,
        };
    }

    if (!data) {
        logger.error("No data returned from createCustomJob");
        await logger.flush();
        return {
            success: false,
            message: "Failed to create new program",
        };
    }

    await logger.flush();

    // Revalidate the curriculum page to show the new job
    revalidatePath("/dashboard/coach-admin/programs");
    return {
        success: true,
        programId: data.id,
    };
}
