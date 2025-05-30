"use server";

import { createSupabaseServerClient } from "@/utils/supabase/server";
import { getTranslations } from "next-intl/server";
import { Logger } from "next-axiom";
import { validateCoach } from "../../../../actions";
import { Tables } from "@/utils/supabase/database.types";

const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 500;

// Helper function to fan out updates to related questions
async function fanOutUpdateRelatedQuestions(
    updatedData: Partial<Tables<"custom_job_questions">>,
    relatedQuestions: Tables<"custom_job_questions">[],
) {
    const logger = new Logger().with({
        function: "fanOutUpdateRelatedQuestions",
        updatedData,
        relatedQuestions,
    });
    const supabase = await createSupabaseServerClient();
    await Promise.all(relatedQuestions.map(async (relatedQ) => {
        let retries = 0;
        let currentDelay = INITIAL_BACKOFF_MS;
        let lastError: any = null;
        while (retries < MAX_RETRIES) {
            const { error: updateError } = await supabase
                .from("custom_job_questions")
                .update(updatedData)
                .eq("id", relatedQ.id);
            lastError = updateError;
            retries++;
            if (updateError) {
                if (retries < MAX_RETRIES) {
                    logger.warn(
                        `Failed to update related question ${relatedQ.id} on attempt ${retries}. Retrying in ${currentDelay}ms...`,
                        { error: updateError, attempt: retries },
                    );
                    await new Promise((resolve) =>
                        setTimeout(resolve, currentDelay)
                    );
                    currentDelay *= 2;
                } else {
                    logger.error(
                        `Failed to update related question ${relatedQ.id} after ${MAX_RETRIES} attempts.`,
                        { error: lastError },
                    );
                    await logger.flush();
                    throw lastError;
                }
            } else {
                logger.info(
                    `Successfully updated related question ${relatedQ.id} in program ${relatedQ.custom_job_id} on attempt ${
                        retries + 1
                    }.`,
                );
                await logger.flush();
                return;
            }
        }
    }));
    logger.info(
        `Successfully fanned out updates for ${relatedQuestions.length} related questions.`,
    );
    await logger.flush();
}

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
    let originalRelatedQuestions: Tables<"custom_job_questions">[] = [];

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

        const { data: relatedQsData, error: relatedQsError } = await supabase
            .from("custom_job_questions")
            .select("*")
            .eq("source_custom_job_question_id", questionId);

        if (relatedQsError) {
            logger.error("Failed to fetch related questions for backup.", {
                error: relatedQsError,
            });
            await logger.flush();
        }
        if (relatedQsData) {
            originalRelatedQuestions = relatedQsData;
        }

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

        await fanOutUpdateRelatedQuestions(
            mainQuestionUpdatePayload,
            originalRelatedQuestions,
        );

        logger.info("Successfully edited question and fanned out updates.", {
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

        if (originalRelatedQuestions.length > 0) {
            const { error: revertRelatedError } = await supabase
                .from("custom_job_questions")
                .upsert(originalRelatedQuestions);

            if (revertRelatedError) {
                logger.error("Failed to revert related questions updates.", {
                    count: originalRelatedQuestions.length,
                    error: revertRelatedError,
                });
            } else {
                logger.info(
                    `Successfully submitted revert for ${originalRelatedQuestions.length} related questions.`,
                );
            }
            await logger.flush();
        }
        return {
            success: false,
            message: t("pleaseTryAgain"),
        };
    }
}
