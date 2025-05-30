"use server";

import { createSupabaseServerClient } from "@/utils/supabase/server";
import { validateCoach } from "../../../actions";
import { getTranslations } from "next-intl/server";
import { Logger } from "next-axiom";
import { Tables } from "@/utils/supabase/database.types";

// Helper function to fan out the question to linked programs
async function fanOutQuestionToLinkedPrograms(
    originalQuestion: Tables<"custom_job_questions">,
) {
    const supabase = await createSupabaseServerClient();
    const logger = new Logger().with({
        function: "fanOutQuestionToLinkedPrograms",
        originalQuestionId: originalQuestion.id,
        sourceProgramId: originalQuestion.custom_job_id,
    });

    const sourceProgramId = originalQuestion.custom_job_id;

    const MAX_RETRIES = 3;
    const INITIAL_BACKOFF_MS = 500;

    const { data: linkedPrograms, error: fetchError } = await supabase
        .from("custom_jobs")
        .select("id")
        .eq("source_custom_job_id", sourceProgramId);

    if (fetchError) {
        logger.error("Failed to fetch linked programs for fan-out.", {
            sourceProgramId,
            error: fetchError,
        });
        await logger.flush();
        throw fetchError;
    }

    // Execute inserts in parallel with retry logic
    await Promise.all(linkedPrograms.map(async (program) => {
        let retries = 0;
        let currentDelay = INITIAL_BACKOFF_MS;
        let lastError: any = null;

        while (retries < MAX_RETRIES) {
            const { error: insertError } = await supabase
                .from("custom_job_questions")
                .insert({
                    question: originalQuestion.question,
                    answer_guidelines: originalQuestion.answer_guidelines,
                    custom_job_id: program.id,
                    publication_status: originalQuestion.publication_status,
                    question_type: originalQuestion.question_type,
                    source_custom_job_question_id: originalQuestion.id,
                });
            if (insertError) {
                lastError = insertError;
                retries++;
                if (retries < MAX_RETRIES) {
                    logger.warn(
                        `Failed to insert question into linked program ${program.id} on attempt ${retries}. Retrying in ${currentDelay}ms...`,
                        {
                            originalQuestionId: originalQuestion.id,
                            targetProgramId: program.id,
                            attempt: retries,
                            error: insertError,
                        },
                    );
                    await logger.flush();
                    await new Promise((resolve) =>
                        setTimeout(resolve, currentDelay)
                    );
                    currentDelay *= 2; // Exponential backoff
                } else {
                    logger.error(
                        `Failed to insert question into linked program ${program.id} after ${MAX_RETRIES} attempts.`,
                        {
                            originalQuestionId: originalQuestion.id,
                            targetProgramId: program.id,
                            error: lastError,
                        },
                    );
                    await logger.flush();
                    throw new Error(
                        "Failed to write questions to linked programs",
                    );
                }
            } else {
                logger.info(
                    `Successfully inserted question into linked program ${program.id} on attempt ${
                        retries + 1
                    }.`,
                    {
                        originalQuestionId: originalQuestion.id,
                        targetProgramId: program.id,
                    },
                );
                await logger.flush();
                return;
            }
        }
    }));
}

const deleteAllQuestionInstances = async (questionId: string) => {
    const supabase = await createSupabaseServerClient();
    const logger = new Logger().with({
        function: "deleteAllQuestionInstances",
        questionId,
    });

    const { error } = await supabase.from("custom_job_questions").delete().eq(
        "id",
        questionId,
    );
    if (error) {
        logger.error("Failed to delete all question instances", {
            error,
        });
        await logger.flush();
    }

    const { error: deleteLinkedQuesitonsError } = await supabase.from(
        "custom_job_questions",
    ).delete().eq("source_custom_job_question_id", questionId);

    if (deleteLinkedQuesitonsError) {
        logger.error("Failed to delete linked questions", {
            error: deleteLinkedQuesitonsError,
        });
        await logger.flush();
    }
};

export async function createQuestion(
    formData: FormData,
) {
    const supabase = await createSupabaseServerClient();
    const t = await getTranslations("errors");
    const questionCreationT = await getTranslations(
        "coachAdminPortal.questionsPage.createQuestions",
    );
    let logger = new Logger().with({
        function: "createQuestion",
    });
    let questionId = "";
    try {
        // Validate coach
        const coach = await validateCoach();
        if (!coach) {
            logger.error("User is not coach");
            await logger.flush();
            return {
                success: false,
                message: t("noPermission"),
            };
        }

        // Extract form data
        const question = formData.get("question") as string;
        const answerGuidelines = formData.get("answerGuidelines") as string;
        const programId = formData.get("programId") as string;
        const publicationStatus = formData.get("publication_status") as
            | "published"
            | "draft";

        logger = logger.with({
            question,
            answerGuidelines,
            programId,
            publicationStatus,
        });

        // Validate required fields
        if (!question || !answerGuidelines) {
            logger.error("Missing question or answerGuidelines field");
            await logger.flush();
            return {
                success: false,
                message: questionCreationT("errors.missingFields"),
            };
        }

        if (!programId) {
            logger.error("Program id not found");
            await logger.flush();
            return {
                success: false,
                message: t("pleaseTryAgain"),
            };
        }

        // Create the question
        const { data, error } = await supabase
            .from("custom_job_questions")
            .insert({
                question,
                answer_guidelines: answerGuidelines,
                custom_job_id: programId,
                question_type: "user_generated",
                publication_status: publicationStatus,
            })
            .select()
            .single();

        if (error || !data) {
            logger.error("Error creating question:", { error });
            await logger.flush();
            return {
                success: false,
                message: "Failed to create question: " +
                    (error?.message || "Unknown error"),
            };
        }
        questionId = data.id;

        await fanOutQuestionToLinkedPrograms(data);

        await logger.flush();
        return {
            success: true,
            questionId: data.id,
        };
    } catch (error: any) {
        logger.error("Error creating question", {
            error,
        });
        await logger.flush();
        if (questionId) {
            await deleteAllQuestionInstances(questionId);
        }
        return {
            success: false,
            message: t("pleaseTryAgain"),
        };
    }
}
