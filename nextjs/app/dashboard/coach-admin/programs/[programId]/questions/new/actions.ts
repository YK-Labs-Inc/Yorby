"use server";

import { createSupabaseServerClient } from "@/utils/supabase/server";
import { validateCoach } from "../../../actions";
import { getTranslations } from "next-intl/server";
import { Logger } from "next-axiom";

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
        return {
            success: false,
            message: t("pleaseTryAgain"),
        };
    }
}
