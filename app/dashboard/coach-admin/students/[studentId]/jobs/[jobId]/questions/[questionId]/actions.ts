"use server";

import { createSupabaseServerClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { Logger } from "next-axiom";
import { getTranslations } from "next-intl/server";

export async function createCoachFeedback(formData: FormData) {
    const submissionId = formData.get("submissionId") as string;
    const pros = JSON.parse(formData.get("pros") as string) as string[];
    const cons = JSON.parse(formData.get("cons") as string) as string[];
    const hasPros = Array.isArray(pros) &&
        pros.some((p) => p.trim().length > 0);
    const hasCons = Array.isArray(cons) &&
        cons.some((c) => c.trim().length > 0);
    if (!hasPros && !hasCons) {
        return {
            error:
                "Please provide at least one strength or one area for improvement.",
        };
    }
    const supabase = await createSupabaseServerClient();
    const t = await getTranslations("errors");
    const logger = new Logger().with({
        function: "createCoachFeedback",
        submissionId,
        pros,
        cons,
    });
    try {
        // Get the current user and verify they are a coach
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            logger.error("Not authenticated");
            await logger.flush();
            return { error: t("pleaseTryAgain") };
        }
        const { data: coach } = await supabase
            .from("coaches")
            .select("id")
            .eq("user_id", user.id)
            .single();
        if (!coach) {
            logger.error("Not authorized as a coach");
            await logger.flush();
            return { error: t("pleaseTryAgain") };
        }
        // Create the feedback
        const { error } = await supabase
            .from("custom_job_question_submission_feedback")
            .insert({
                submission_id: submissionId,
                feedback_role: "user",
                pros: pros,
                cons: cons,
                confidence_score: 1.0,
            });
        if (error) {
            logger.error("Failed to create feedback", { error });
            await logger.flush();
            return { error: t("pleaseTryAgain") };
        }
        logger.info("Successfully created coach feedback");
        await logger.flush();
        revalidatePath("/dashboard/coach-admin/students");
        return { success: true };
    } catch (error) {
        logger.error("Error in createCoachFeedback", { error });
        await logger.flush();
        return { error: t("pleaseTryAgain") };
    }
}

export async function updateCoachFeedback(formData: FormData) {
    const feedbackId = formData.get("feedbackId") as string;
    const pros = JSON.parse(formData.get("pros") as string) as string[];
    const cons = JSON.parse(formData.get("cons") as string) as string[];
    const hasPros = Array.isArray(pros) &&
        pros.some((p) => p.trim().length > 0);
    const hasCons = Array.isArray(cons) &&
        cons.some((c) => c.trim().length > 0);
    if (!hasPros && !hasCons) {
        return {
            error:
                "Please provide at least one strength or one area for improvement.",
        };
    }
    const supabase = await createSupabaseServerClient();
    const t = await getTranslations("errors");
    const logger = new Logger().with({
        function: "updateCoachFeedback",
        feedbackId,
        pros,
        cons,
    });
    try {
        // Verify coach access
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            logger.error("Not authenticated");
            await logger.flush();
            return { error: t("pleaseTryAgain") };
        }
        const { data: coach } = await supabase
            .from("coaches")
            .select("id")
            .eq("user_id", user.id)
            .single();
        if (!coach) {
            logger.error("Not authorized as a coach");
            await logger.flush();
            return { error: t("pleaseTryAgain") };
        }
        // Update the feedback
        const { error } = await supabase
            .from("custom_job_question_submission_feedback")
            .update({
                pros: pros,
                cons: cons,
            })
            .eq("id", feedbackId)
            .eq("feedback_role", "user");
        if (error) {
            logger.error("Failed to update feedback", { error });
            await logger.flush();
            return { error: t("pleaseTryAgain") };
        }
        logger.info("Successfully updated coach feedback");
        await logger.flush();
        revalidatePath("/dashboard/coach-admin/students");
        return { success: true };
    } catch (error) {
        logger.error("Error in updateCoachFeedback", { error });
        await logger.flush();
        return { error: t("pleaseTryAgain") };
    }
}

export async function deleteCoachFeedback(formData: FormData) {
    const feedbackId = formData.get("feedbackId") as string;
    const supabase = await createSupabaseServerClient();
    const t = await getTranslations("errors");
    const logger = new Logger().with({
        function: "deleteCoachFeedback",
        feedbackId,
    });
    try {
        // Verify coach access
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            logger.error("Not authenticated");
            await logger.flush();
            return { error: t("pleaseTryAgain") };
        }
        const { data: coach } = await supabase
            .from("coaches")
            .select("id")
            .eq("user_id", user.id)
            .single();
        if (!coach) {
            logger.error("Not authorized as a coach");
            await logger.flush();
            return { error: t("pleaseTryAgain") };
        }
        // Delete the feedback
        const { error } = await supabase
            .from("custom_job_question_submission_feedback")
            .delete()
            .eq("id", feedbackId)
            .eq("feedback_role", "user");
        if (error) {
            logger.error("Failed to delete feedback", { error });
            await logger.flush();
            return { error: t("pleaseTryAgain") };
        }
        logger.info("Successfully deleted coach feedback");
        await logger.flush();
        revalidatePath("/dashboard/coach-admin/students");
        return { success: true };
    } catch (error) {
        logger.error("Error in deleteCoachFeedback", { error });
        await logger.flush();
        return { error: t("pleaseTryAgain") };
    }
}
