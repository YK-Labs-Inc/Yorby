"use server";

import { createSupabaseServerClient } from "@/utils/supabase/server";
import { validateCoach } from "../../actions";
import { Logger } from "next-axiom";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";

export async function updateCustomJob(
    formData: FormData,
) {
    const supabase = await createSupabaseServerClient();
    const t = await getTranslations("errors");
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
    const programId = formData.get("programId") as string;
    const title = formData.get("title") as string;

    logger = logger.with({ programId, title });

    if (!programId) {
        logger.error("Program id is required");
        await logger.flush();
        return {
            success: false,
            message: t("pleaseTryAgain"),
        };
    }

    // Validate required fields
    if (!title) {
        logger.error("Title is required");
        await logger.flush();
        return {
            success: false,
            message: "Title is required",
        };
    }

    // Create the custom job
    const { data, error } = await supabase
        .from("custom_jobs")
        .upsert({
            id: programId,
            job_title: title,
            user_id: coach.userId,
            coach_id: coach.coachId,
            status: "unlocked",
        })
        .select()
        .single();

    if (error) {
        logger.error("Error updating custom job:", { error });
        await logger.flush();
        return {
            success: false,
            message: "Failed to update program — please try again",
        };
    }

    if (!data) {
        logger.error("No data returned from createCustomJob");
        await logger.flush();
        return {
            success: false,
            message: "Failed to update program — please try again",
        };
    }

    await logger.flush();

    // Revalidate the curriculum page to show the new job
    revalidatePath(`/dashboard/coach-admin/programs/${programId}`);
    return {
        success: true,
        programId: data.id,
    };
}
