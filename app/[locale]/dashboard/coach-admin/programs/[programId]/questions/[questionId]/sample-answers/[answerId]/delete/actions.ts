"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Logger } from "next-axiom";
import { getTranslations } from "next-intl/server";

export async function deleteSampleAnswer(formData: FormData) {
    const programId = formData.get("programId") as string;
    const questionId = formData.get("questionId") as string;
    const answerId = formData.get("answerId") as string;
    const t = await getTranslations("errors");
    let logger = new Logger().with({
        function: "deleteSampleAnswer",
        answerId,
        questionId,
        programId,
    });

    if (!programId || !questionId || !answerId) {
        logger.error("Missing required parameters");
        await logger.flush();
        redirect(
            `/dashboard/coach-admin/programs/${programId}/questions/${questionId}/sample-answers/${answerId}/delete?error_message=${
                encodeURIComponent(t("pleaseTryAgain"))
            }`,
        );
    }

    try {
        const supabase = await createSupabaseServerClient();

        // Delete the sample answer
        const { error } = await supabase
            .from("custom_job_question_sample_answers")
            .delete()
            .eq("id", answerId);

        if (error) {
            logger.error("Error deleting sample answer:", { error });
            await logger.flush();
            redirect(
                `/dashboard/coach-admin/programs/${programId}/questions/${questionId}/sample-answers/${answerId}/delete?error_message=${
                    encodeURIComponent(t("pleaseTryAgain"))
                }`,
            );
        }

        logger.info("Successfully deleted sample answer");
        await logger.flush();

        // Redirect to success page
        redirect(
            `/dashboard/coach-admin/programs/${programId}/questions/${questionId}/sample-answers`,
        );
    } catch (error) {
        logger.error("Unexpected error in deleteSampleAnswer:", { error });
        await logger.flush();
        redirect(
            `/dashboard/coach-admin/programs/${programId}/questions/${questionId}/sample-answers/${answerId}/delete?error_message=${
                encodeURIComponent(t("pleaseTryAgain"))
            }`,
        );
    }
}
