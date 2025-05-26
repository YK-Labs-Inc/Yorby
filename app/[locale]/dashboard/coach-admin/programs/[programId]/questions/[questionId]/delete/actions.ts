"use server";

import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Logger } from "next-axiom";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { validateCoach } from "../../../../actions"; // Assuming validateCoach is in a common parent actions file
import { Tables, TablesInsert } from "@/utils/supabase/database.types";

const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 500;

// Helper function to fan out delete related questions
const fanOutDeleteRelatedQuestions = async (
    originalQuestionId: string,
    relatedQuestions: Tables<"custom_job_questions">[],
) => {
    const logger = new Logger().with({
        function: "fanOutDeleteRelatedQuestions",
        originalQuestionId,
    });
    const supabase = await createSupabaseServerClient();
    if (relatedQuestions.length === 0) {
        logger.info("No related questions found to delete.");
        await logger.flush();
        return;
    }

    await Promise.all(relatedQuestions.map(async (question) => {
        let retries = 0;
        let currentDelay = INITIAL_BACKOFF_MS;
        let lastError: any = null;

        while (retries < MAX_RETRIES) {
            const { error: deleteError } = await supabase
                .from("custom_job_questions")
                .delete()
                .eq("id", question.id);

            lastError = deleteError;
            retries++;
            if (deleteError) {
                if (retries < MAX_RETRIES) {
                    logger.warn(
                        `Failed to delete related question ${question.id} on attempt ${retries}. Retrying in ${currentDelay}ms...`,
                        { error: deleteError, attempt: retries },
                    );
                    await new Promise((resolve) =>
                        setTimeout(resolve, currentDelay)
                    );
                    currentDelay *= 2;
                } else {
                    logger.error(
                        `Failed to delete related question ${question.id} after ${MAX_RETRIES} attempts.`,
                        { error: lastError },
                    );
                    await logger.flush();
                    throw new Error(
                        "Hit max retry logic to delete related question",
                    );
                }
            } else {
                logger.info(
                    `Successfully deleted related question ${question.id} from program ${question.custom_job_id} on attempt ${
                        retries + 1
                    }.`,
                );
                await logger.flush();
                return;
            }
        }
    }));
};

export const deleteQuestion = async (
    data: FormData,
) => {
    const supabase = await createSupabaseServerClient();
    const questionId = data.get("questionId") as string;
    const programId = data.get("programId") as string;
    const t = await getTranslations("errors");
    let logger = new Logger().with({
        function: "deleteQuestion",
        questionId,
        programId,
    });

    // Variables to store original data for potential revert
    let originalMainQuestion: Tables<"custom_job_questions"> | null = null;
    let originalRelatedQuestions: Tables<"custom_job_questions">[] = [];

    if (!questionId || !programId) {
        logger.warn("Missing questionId or programId for deletion.");
        await logger.flush();
        redirect(
            `/dashboard/coach-admin/programs/${programId}/questions/${questionId}/delete?error_message=${
                t("pleaseTryAgain")
            }`,
        );
    }

    // Fetch main question data for potential revert and to verify ownership
    const { data: mainQuestionData, error: mainQuestionError } = await supabase
        .from("custom_job_questions")
        .select("*") // Select all fields for potential revert
        .eq("id", questionId)
        .single();

    if (mainQuestionError || !mainQuestionData) {
        logger.error("Main question not found or error fetching it.", {
            error: mainQuestionError,
        });
        await logger.flush();
        redirect(
            `/dashboard/coach-admin/programs/${programId}/questions/${questionId}/delete?error_message=${
                encodeURIComponent(t("pleaseTryAgain"))
            }`,
        );
    }
    originalMainQuestion = mainQuestionData; // Store for revert

    // Fetch related questions data for potential revert
    const { data: relatedQuestionsData, error: fetchRelatedError } =
        await supabase
            .from("custom_job_questions")
            .select("*") // Select all fields for potential revert
            .eq("source_custom_job_question_id", questionId);

    if (fetchRelatedError) {
        logger.error(
            "Failed to fetch related questions for potential revert.",
            {
                error: fetchRelatedError,
            },
        );
        await logger.flush();
        redirect(
            `/dashboard/coach-admin/programs/${programId}/questions/${questionId}/delete?error_message=${
                encodeURIComponent(t("pleaseTryAgain"))
            }`,
        );
    }
    if (relatedQuestionsData) {
        originalRelatedQuestions = relatedQuestionsData;
    }

    // Delete the main question
    const { error: mainDeleteError } = await supabase
        .from("custom_job_questions")
        .delete()
        .eq("id", questionId);

    if (mainDeleteError) {
        logger.error("Error deleting main question:", {
            error: mainDeleteError,
        });
        await logger.flush();
        redirect(
            `/dashboard/coach-admin/programs/${programId}/questions/${questionId}/delete?error_message=${
                encodeURIComponent(t("pleaseTryAgain"))
            }`,
        );
    }
    logger.info("Successfully deleted main question.");

    let failedDeletingRelatedQuestions = false;
    try {
        // Fan out deletion for related questions
        await fanOutDeleteRelatedQuestions(
            questionId,
            originalRelatedQuestions,
        );
    } catch (error) {
        failedDeletingRelatedQuestions = true;
        logger.error("Error deleting related questions.", {
            error: error,
        });
        await revertQuestionDeletion(
            originalMainQuestion,
            originalRelatedQuestions,
        );
        await logger.flush();
    }
    if (failedDeletingRelatedQuestions) {
        redirect(
            `/dashboard/coach-admin/programs/${programId}/questions/${questionId}/delete?error_message=${
                encodeURIComponent(t("pleaseTryAgain"))
            }`,
        );
    }

    logger.info(
        "Main question and related questions deletion process complete. Redirecting.",
    );
    await logger.flush();
    redirect(
        `/dashboard/coach-admin/programs/${programId}`,
    );
};

const revertQuestionDeletion = async (
    originalMainQuestion: Tables<"custom_job_questions">,
    originalRelatedQuestions: Tables<"custom_job_questions">[],
) => {
    const logger = new Logger().with({ function: "revertQuestionDeletion" });
    const supabase = await createSupabaseServerClient();
    // Attempt to re-insert main question if it was fetched
    if (originalMainQuestion) {
        // Supabase insert expects an object without 'id' and 'created_at' if they are auto-generated
        // and other fields should match the Insert type.
        // We fetched '*', so we need to prepare it for insert.
        const { id, created_at, ...mainQuestionToReinsert } =
            originalMainQuestion;
        const { error: revertMainError } = await supabase
            .from("custom_job_questions")
            .insert(
                mainQuestionToReinsert,
            );

        if (revertMainError) {
            logger.error("Failed to revert main question deletion.", {
                error: revertMainError,
            });
        } else {
            logger.info("Successfully reverted main question deletion.", {
                questionId: originalMainQuestion.id,
            });
        }
        await logger.flush();
    }

    // Attempt to re-insert related questions if they were fetched
    if (originalRelatedQuestions.length > 0) {
        supabase.from("custom_job_questions").upsert(originalRelatedQuestions);
    }
};
