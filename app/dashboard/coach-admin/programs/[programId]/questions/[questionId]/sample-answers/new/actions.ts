"use server";

import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Logger } from "next-axiom";
import { getTranslations } from "next-intl/server";
import { revalidatePath } from "next/cache";

export async function createSampleAnswer(
    formData: FormData,
) {
    let logger = new Logger().with({ function: "createSampleAnswer" });
    try {
        const supabase = await createSupabaseServerClient();
        const answer = formData.get("answer") as string;
        const questionId = formData.get("questionId") as string;
        const programId = formData.get("programId") as string;
        logger = logger.with({
            answer,
            questionId,
            programId,
        });
        const t = await getTranslations(
            "coachAdminPortal.sampleAnswersPage.sampleAnswerForm",
        );

        if (!answer) {
            logger.error("Answer is required");
            await logger.flush();
            return {
                success: false,
                message: t("answerRequired"),
            };
        }

        // Create the sample answer
        const { data: sampleAnswer, error } = await supabase
            .from("custom_job_question_sample_answers")
            .insert({
                answer,
                question_id: questionId,
            })
            .select()
            .single();

        if (error) {
            logger.error("Error creating sample answer:", error);
            await logger.flush();
            return {
                success: false,
                message: "Failed to create sample answer. Please try again.",
            };
        }

        // Revalidate the sample answers page
        revalidatePath(
            `/dashboard/coach-admin/programs/${programId}/questions/${questionId}`,
        );

        return {
            success: true,
            sampleAnswerId: sampleAnswer.id,
        };
    } catch (error) {
        logger.error("Error in createSampleAnswer:", { error });
        await logger.flush();
        return {
            success: false,
            message: "An unexpected error occurred. Please try again.",
        };
    }
}
