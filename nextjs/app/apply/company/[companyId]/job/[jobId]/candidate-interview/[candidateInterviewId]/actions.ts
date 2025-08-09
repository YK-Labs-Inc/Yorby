"use server";

import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Logger } from "next-axiom";
import { getTranslations } from "next-intl/server";

export async function saveCodingSubmission(formData: FormData) {
  const logger = new Logger().with({
    function: "saveCodingSubmission",
  });
  const t = await getTranslations("apply.codingInterview.logging");

  const candidateInterviewId = formData.get("candidateInterviewId") as string;
  const questionId = formData.get("questionId") as string;
  const submissionText = formData.get("submissionText") as string;
  const submissionNumber = parseInt(formData.get("submissionNumber") as string, 10);

  try {
    logger.info(t("savingCodeSubmission"), {
      candidateInterviewId,
      questionId,
      submissionNumber,
      codeLength: submissionText.length,
    });

    const supabase = await createSupabaseServerClient();

    const { error } = await supabase
      .from("job_interview_coding_submissions")
      .insert({
        candidate_interview_id: candidateInterviewId,
        question_id: questionId,
        submission_text: submissionText,
        submission_number: submissionNumber,
      });

    if (error) {
      logger.error(t("databaseError"), {
        candidateInterviewId,
        questionId,
        submissionNumber,
        error: error.message,
        errorCode: error.code,
      });
      
      await logger.flush();
      return { success: false, error: error.message };
    }

    logger.info(t("savedSuccessfully"), {
      candidateInterviewId,
      questionId,
      submissionNumber,
    });

    await logger.flush();
    return { success: true };
  } catch (error) {
    logger.error(t("unexpectedServerError"), {
      candidateInterviewId,
      questionId,
      submissionNumber,
      error: error instanceof Error ? error.message : t("unknownError"),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    await logger.flush();
    return { 
      success: false, 
      error: error instanceof Error ? error.message : t("unknownError") 
    };
  }
}