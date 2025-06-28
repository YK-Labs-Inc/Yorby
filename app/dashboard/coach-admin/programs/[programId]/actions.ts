"use server";

import { createSupabaseServerClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { Logger } from "next-axiom";
import { validateCoach } from "../actions"; // Corrected path

export async function updateQuestionPublicationStatus(
    questionId: string,
    programId: string,
    status: "published" | "draft",
) {
    const supabase = await createSupabaseServerClient();
    const t = await getTranslations("errors");
    const logger = new Logger().with({
        function: "updateQuestionPublicationStatus",
        questionId,
        programId,
        status,
    });

    const coach = await validateCoach();
    if (!coach) {
        logger.error("User is not a coach or not authorized.");
        await logger.flush();
        return { success: false, message: t("noPermission") };
    }

    // Verify the program (custom_job) belongs to this coach
    const { data: jobData, error: jobError } = await supabase
        .from("custom_jobs")
        .select("id")
        .eq("id", programId)
        .eq("coach_id", coach.coachId)
        .single();

    if (jobError || !jobData) {
        logger.error("Program not found or does not belong to the coach.", {
            jobError,
        });
        await logger.flush();
        return { success: false, message: t("noPermission") };
    }

    // Verify the question belongs to this program
    const { data: questionData, error: questionError } = await supabase
        .from("custom_job_questions")
        .select("id")
        .eq("id", questionId)
        .eq("custom_job_id", programId)
        .single();

    if (questionError || !questionData) {
        logger.error("Question not found or does not belong to the program.", {
            questionError,
        });
        await logger.flush();
        return { success: false, message: t("pleaseTryAgain") }; // Or a more specific error
    }

    const { error: mainUpdateError } = await supabase
        .from("custom_job_questions")
        .update({ publication_status: status })
        .eq("id", questionId);

    if (mainUpdateError) {
        logger.error("Failed to update question publication status.", {
            error: mainUpdateError,
        });
        await logger.flush();
        return { success: false, message: mainUpdateError.message };
    }

    // Fan-out operations removed - with new enrollment system,
    // students read directly from coach's master questions

    revalidatePath(`/dashboard/coach-admin/programs/${programId}`);
    await logger.flush();
    return { success: true };
}

export async function updateKnowledgeBase(
    programId: string,
    prevState: { success: boolean; message?: string },
    formData: FormData,
): Promise<{ success: boolean; message?: string }> {
    const supabase = await createSupabaseServerClient();
    const t = await getTranslations("errors");
    const tKnowledgeBase = await getTranslations("coachAdminPortal.programsPage.programDetailPage.knowledgeBase");
    const logger = new Logger().with({
        function: "updateKnowledgeBase",
        programId,
    });

    try {
        const coach = await validateCoach();
        if (!coach) {
            logger.error("User is not a coach or not authorized.");
            await logger.flush();
            return { success: false, message: t("noPermission") };
        }

        // Verify the program belongs to this coach
        const { data: jobData, error: jobError } = await supabase
            .from("custom_jobs")
            .select("id")
            .eq("id", programId)
            .eq("coach_id", coach.coachId)
            .single();

        if (jobError || !jobData) {
            logger.error("Program not found or does not belong to the coach.", {
                jobError,
            });
            await logger.flush();
            return { success: false, message: t("noPermission") };
        }

        const knowledgeBase = formData.get("knowledgeBase") as string;

        // Check if knowledge base exists
        const { data: existingKB } = await supabase
            .from("custom_job_knowledge_base")
            .select("id")
            .eq("custom_job_id", programId)
            .single();

        if (existingKB) {
            // Update existing knowledge base
            const { error: updateError } = await supabase
                .from("custom_job_knowledge_base")
                .update({ knowledge_base: knowledgeBase })
                .eq("custom_job_id", programId);

            if (updateError) {
                logger.error("Failed to update knowledge base.", {
                    error: updateError,
                });
                await logger.flush();
                return { success: false, message: t("pleaseTryAgain") };
            }
        } else {
            // Create new knowledge base
            const { error: insertError } = await supabase
                .from("custom_job_knowledge_base")
                .insert({
                    custom_job_id: programId,
                    knowledge_base: knowledgeBase,
                });

            if (insertError) {
                logger.error("Failed to create knowledge base.", {
                    error: insertError,
                });
                await logger.flush();
                return { success: false, message: t("pleaseTryAgain") };
            }
        }

        revalidatePath(`/dashboard/coach-admin/programs/${programId}`);
        logger.info("Knowledge base updated successfully.", { programId });
        await logger.flush();
        return {
            success: true,
            message: tKnowledgeBase("updateSuccess"),
        };
    } catch (error) {
        logger.error("Unexpected error updating knowledge base.", { error });
        await logger.flush();
        return { success: false, message: t("pleaseTryAgain") };
    }
}
