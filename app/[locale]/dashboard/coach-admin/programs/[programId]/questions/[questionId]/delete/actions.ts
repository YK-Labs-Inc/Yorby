"use server";

import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Logger } from "next-axiom";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

export const deleteQuestion = async (
    data: FormData,
) => {
    const supabase = await createSupabaseServerClient();
    const questionId = data.get("questionId") as string;
    const programId = data.get("programId") as string;
    const t = await getTranslations("errors");
    let logger = new Logger().with({ function: "deleteQuestion", questionId });
    if (!questionId || !programId) {
        redirect(
            `/dashboard/coach-admin/programs/${programId}/questions/${questionId}/delete?error_message=${
                t("pleaseTryAgain")
            }`,
        );
    }
    const { error } = await supabase
        .from("custom_job_questions")
        .delete()
        .eq("id", questionId);
    if (error) {
        logger.error("Error deleting question:", { error });
        await logger.flush();
        redirect(
            `/dashboard/coach-admin/programs/${programId}/questions/${questionId}/delete?error_message=${
                t("pleaseTryAgain")
            }`,
        );
    }
    logger.info("Successfully deleted question");
    await logger.flush();
    redirect(
        `/dashboard/coach-admin/programs/${programId}`,
    );
};
