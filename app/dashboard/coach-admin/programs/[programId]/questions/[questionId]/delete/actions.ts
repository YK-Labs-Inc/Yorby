"use server";

import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Logger } from "next-axiom";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { validateCoach } from "../../../../actions"; // Assuming validateCoach is in a common parent actions file
import { Tables } from "@/utils/supabase/database.types";

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
    // Fan-out operations removed - with new enrollment system,
    // students read directly from coach's master questions
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

    logger.info(
        "Question deletion complete. Redirecting.",
    );
    await logger.flush();
    redirect(
        `/dashboard/coach-admin/programs/${programId}`,
    );
};
