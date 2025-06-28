"use server";

import { createSupabaseServerClient } from "@/utils/supabase/server";
import { getTranslations } from "next-intl/server";
import { Logger } from "next-axiom";
import { Tables } from "@/utils/supabase/database.types";

export async function editQuestion(
    formData: FormData,
) {
    const supabase = await createSupabaseServerClient();
    const t = await getTranslations("errors");
    const questionPageT = await getTranslations(
        "coachAdminPortal.questionsPage",
    );
    let logger = new Logger().with({
        function: "editQuestion",
    });

    let originalMainQuestion: Tables<"custom_job_questions"> | null = null;

    const programId = formData.get("programId") as string;
    const questionId = formData.get("questionId") as string;

    try {
        const questionText = formData.get("question") as string;
        const answerGuidelines = formData.get("answerGuidelines") as string;
        const publicationStatus = formData.get("publication_status") as
            | "published"
            | "draft";

        logger = logger.with({
            question: questionText,
            answerGuidelines,
            programId,
            questionId,
            publicationStatus,
        });

        if (!questionId || !programId) {
            logger.warn("Missing questionId or programId for edit.");
            await logger.flush();
            return { success: false, message: t("pleaseTryAgain") };
        }

        if (!questionText || !answerGuidelines) {
            logger.error(
                "Missing question or answerGuidelines field from form",
            );
            await logger.flush();
            return {
                success: false,
                message: questionPageT("createQuestions.errors.missingFields"),
            };
        }

        const { data: mainQData, error: mainQError } = await supabase
            .from("custom_job_questions")
            .select("*")
            .eq("id", questionId)
            .single();

        if (mainQError || !mainQData) {
            logger.error("Failed to fetch main question for edit/backup.", {
                error: mainQError,
            });
            await logger.flush();
            return { success: false, message: t("pleaseTryAgain") };
        }
        originalMainQuestion = mainQData;

        const mainQuestionUpdatePayload: Partial<
            Tables<"custom_job_questions">
        > = {
            question: questionText,
            answer_guidelines: answerGuidelines,
            publication_status: publicationStatus,
            question_type: originalMainQuestion.question_type,
        };

        const { data: updatedMainQuestion, error: mainUpdateError } =
            await supabase
                .from("custom_job_questions")
                .update(mainQuestionUpdatePayload)
                .eq("id", questionId);

        if (mainUpdateError) {
            logger.error("Error updating main question.", {
                error: mainUpdateError,
            });
            await logger.flush();
            throw mainUpdateError ||
                new Error("Main question update failed to return data.");
        }
        logger.info("Successfully updated main question.", { questionId });

        logger.info("Successfully edited question.", {
            questionId,
        });
        await logger.flush();
        return {
            success: true,
            questionId: originalMainQuestion.id,
        };
    } catch (error: any) {
        logger.error("Error in editQuestion, attempting to revert changes.", {
            errorMessage: error?.message,
            errorDetails: error,
            mainQuestionId: questionId,
            programId,
        });
        await logger.flush();
        if (originalMainQuestion) {
            const { error: revertMainError } = await supabase
                .from("custom_job_questions")
                .upsert(originalMainQuestion);

            if (revertMainError) {
                logger.error("Failed to revert main question update.", {
                    questionId: originalMainQuestion.id,
                    error: revertMainError,
                });
            } else {
                logger.info("Successfully reverted main question update.", {
                    questionId: originalMainQuestion.id,
                });
            }
            await logger.flush();
        }

        return {
            success: false,
            message: t("pleaseTryAgain"),
        };
    }
}
