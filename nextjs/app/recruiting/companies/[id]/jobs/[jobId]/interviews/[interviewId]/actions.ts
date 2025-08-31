"use server";

import { createSupabaseServerClient } from "@/utils/supabase/server";
import { getServerUser } from "@/utils/auth/server";
import { Logger } from "next-axiom";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";

// Helper function to check if user is a company member
async function checkCompanyMembership(
  userId: string,
  companyId: string
): Promise<{ isAuthorized: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const t = await getTranslations("recruiting.questionsTable.actions.errors");

  // Check if user is a member of the company
  const { data: membership, error: memberError } = await supabase
    .from("company_members")
    .select("role")
    .eq("company_id", companyId)
    .eq("user_id", userId)
    .single();

  if (memberError || !membership) {
    return { isAuthorized: false, error: t("notAuthorizedToManage") };
  }

  // Only owners, admins, and recruiters can manage questions
  const authorizedRoles = ["owner", "admin", "recruiter"];
  return {
    isAuthorized: authorizedRoles.includes(membership.role),
  };
}

// Get the next order index for questions in an interview
async function getNextOrderIndex(interviewId: string): Promise<number> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("job_interview_questions")
    .select("order_index")
    .eq("interview_id", interviewId)
    .order("order_index", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return 1; // Start at 1 if no questions exist
  }

  return data.order_index + 1;
}

export async function createQuestion(
  prevState: { success?: boolean; error?: string },
  formData: FormData
) {
  const interviewId = formData.get("interview_id") as string;
  const jobId = formData.get("job_id") as string;
  const companyId = formData.get("company_id") as string;
  const question = formData.get("question") as string;
  const answer = formData.get("answer") as string;
  const timeLimitMs = formData.get("time_limit_ms") as string;

  const logger = new Logger().with({
    function: "createQuestion",
    interviewId,
    jobId,
    companyId,
  });
  const t = await getTranslations(
    "apply.recruiting.questionsTable.actions.errors"
  );

  try {
    const supabase = await createSupabaseServerClient();
    const user = await getServerUser();

    if (!user) {
      logger.error("User not authenticated");
      await logger.flush();
      return { success: false, error: t("notAuthenticated") };
    }

    // Validate required fields
    if (!question || !interviewId || !jobId || !companyId) {
      return {
        success: false,
        error: t("missingRequiredFields") || "Missing required fields",
      };
    }

    // Check authorization
    const { isAuthorized, error: authError } = await checkCompanyMembership(
      user.id,
      companyId
    );

    if (!isAuthorized) {
      logger.error("User not authorized", { userId: user.id, authError });
      await logger.flush();
      return { success: false, error: authError || t("notAuthorized") };
    }

    // Get interview type for the question
    const { data: interview, error: interviewError } = await supabase
      .from("job_interviews")
      .select("interview_type")
      .eq("id", interviewId)
      .single();

    if (interviewError || !interview) {
      logger.error("Interview not found", { error: interviewError });
      await logger.flush();
      return { success: false, error: "Interview not found" };
    }

    // Step 1: Create the question in the company question bank
    const { data: questionBankEntry, error: bankError } = await supabase
      .from("company_interview_question_bank")
      .insert({
        company_id: companyId,
        question: question,
        answer: answer,
        question_type: interview.interview_type,
      })
      .select()
      .single();

    if (bankError || !questionBankEntry) {
      logger.error("Failed to create question in bank", { error: bankError });
      await logger.flush();
      return { success: false, error: t("failedToCreate") };
    }

    // Step 2: If it's a coding question, create the metadata entry with time limit
    if (interview.interview_type === "coding") {
      let parsedTimeLimitMs = parseInt(timeLimitMs) || 1800000; // Default 30 minutes

      // Enforce minimum of 1 minute and maximum of 45 minutes
      parsedTimeLimitMs = Math.min(Math.max(parsedTimeLimitMs, 60000), 2700000); // 1 min to 45 min in ms

      const { error: metadataError } = await supabase
        .from("company_interview_coding_question_metadata")
        .insert({
          id: questionBankEntry.id,
          time_limit_ms: parsedTimeLimitMs,
        });

      if (metadataError) {
        // Rollback: delete the question from the bank
        await supabase
          .from("company_interview_question_bank")
          .delete()
          .eq("id", questionBankEntry.id);

        logger.error("Failed to create coding question metadata", {
          error: metadataError,
        });
        await logger.flush();
        return { success: false, error: t("failedToCreate") };
      }
    }

    // Step 3: Get the next order index
    const nextOrderIndex = await getNextOrderIndex(interviewId);

    // Step 4: Link the question to the interview
    const { error: linkError } = await supabase
      .from("job_interview_questions")
      .insert({
        interview_id: interviewId,
        question_id: questionBankEntry.id,
        order_index: nextOrderIndex,
      });

    if (linkError) {
      // Rollback: delete the question from the bank
      await supabase
        .from("company_interview_question_bank")
        .delete()
        .eq("id", questionBankEntry.id);

      logger.error("Failed to link question to interview", {
        error: linkError,
      });
      await logger.flush();
      return { success: false, error: t("failedToCreate") };
    }

    logger.info("Question created successfully", {
      questionId: questionBankEntry.id,
      interviewId,
    });
    await logger.flush();

    // Revalidate the interview page
    revalidatePath(
      `/recruiting/companies/${companyId}/jobs/${jobId}/interviews/${interviewId}`
    );

    return { success: true };
  } catch (error: any) {
    logger.error("Unexpected error creating question", {
      error: error.message,
    });
    await logger.flush();
    return { success: false, error: t("unexpectedError") };
  }
}

export async function updateQuestion(
  prevState: { success?: boolean; error?: string },
  formData: FormData
) {
  const questionId = formData.get("question_id") as string;
  const interviewId = formData.get("interview_id") as string;
  const companyId = formData.get("company_id") as string;
  const jobId = formData.get("job_id") as string;
  const question = formData.get("question") as string;
  const answer = formData.get("answer") as string;
  const timeLimitMs = formData.get("time_limit_ms") as string;

  const logger = new Logger().with({
    function: "updateQuestion",
    questionId,
    interviewId,
    companyId,
    jobId,
  });
  const t = await getTranslations("recruiting.questionsTable.actions.errors");

  try {
    const supabase = await createSupabaseServerClient();
    const user = await getServerUser();

    if (!user) {
      logger.error("User not authenticated");
      await logger.flush();
      return { success: false, error: t("notAuthenticated") };
    }

    // Check authorization
    const { isAuthorized, error: authError } = await checkCompanyMembership(
      user.id,
      companyId
    );

    if (!isAuthorized) {
      logger.error("User not authorized", { userId: user.id, authError });
      await logger.flush();
      return { success: false, error: authError || t("notAuthorized") };
    }

    // Validate required fields
    if (!questionId || !question || !interviewId || !jobId || !companyId) {
      logger.error("Missing required fields", {
        questionId,
        question,
        answer,
        interviewId,
        jobId,
        companyId,
      });
      return {
        success: false,
        error: t("missingRequiredFields") || "Missing required fields",
      };
    }

    // Get interview type to determine if we need to handle metadata
    const { data: interview, error: interviewError } = await supabase
      .from("job_interviews")
      .select("interview_type")
      .eq("id", interviewId)
      .single();

    if (interviewError || !interview) {
      logger.error("Interview not found", { error: interviewError });
      await logger.flush();
      return { success: false, error: "Interview not found" };
    }

    // Update the question in the bank
    const { error } = await supabase
      .from("company_interview_question_bank")
      .update({
        question: question,
        answer: answer,
      })
      .eq("id", questionId);

    if (error) {
      logger.error("Failed to update question in question", { error });
      await logger.flush();
      return { success: false, error: t("failedToUpdate") };
    }

    // If it's a coding question, update or create the metadata entry
    if (interview.interview_type === "coding") {
      let parsedTimeLimitMs = parseInt(timeLimitMs) || 1800000; // Default 30 minutes

      // Enforce minimum of 1 minute and maximum of 45 minutes
      parsedTimeLimitMs = Math.min(Math.max(parsedTimeLimitMs, 60000), 2700000); // 1 min to 45 min in ms

      // First, check if metadata exists
      const { data: existingMetadata } = await supabase
        .from("company_interview_coding_question_metadata")
        .select("id")
        .eq("id", questionId)
        .single();

      if (existingMetadata) {
        // Update existing metadata
        const { error: metadataError } = await supabase
          .from("company_interview_coding_question_metadata")
          .update({
            time_limit_ms: parsedTimeLimitMs,
          })
          .eq("id", questionId);

        if (metadataError) {
          logger.error("Failed to update coding question metadata", {
            error: metadataError,
          });
          await logger.flush();
          return { success: false, error: t("failedToUpdate") };
        }
      } else {
        // Create new metadata entry
        const { error: metadataError } = await supabase
          .from("company_interview_coding_question_metadata")
          .insert({
            id: questionId,
            time_limit_ms: parsedTimeLimitMs,
          });

        if (metadataError) {
          logger.error("Failed to create coding question metadata", {
            error: metadataError,
          });
          await logger.flush();
          return { success: false, error: t("failedToUpdate") };
        }
      }
    }

    logger.info("Question updated successfully", { questionId });
    await logger.flush();

    revalidatePath(
      `/recruiting/companies/${companyId}/jobs/${jobId}/interviews/${interviewId}`
    );
    return { success: true };
  } catch (error: any) {
    logger.error("Unexpected error updating question", {
      error: error.message,
    });
    await logger.flush();
    return { success: false, error: t("unexpectedError") };
  }
}

export async function deleteQuestion(
  prevState: { success?: boolean; error?: string },
  formData: FormData
) {
  const jobInterviewQuestionId = formData.get(
    "job_interview_question_id"
  ) as string;
  const interviewId = formData.get("interview_id") as string;
  const jobId = formData.get("job_id") as string;
  const companyId = formData.get("company_id") as string;

  const logger = new Logger().with({
    function: "deleteQuestion",
    jobInterviewQuestionId,
    interviewId,
    companyId,
  });
  const t = await getTranslations("recruiting.questionsTable.actions.errors");

  try {
    const supabase = await createSupabaseServerClient();
    const user = await getServerUser();

    if (!user) {
      logger.error("User not authenticated");
      await logger.flush();
      return { success: false, error: t("notAuthenticated") };
    }

    // Validate required fields
    if (!jobInterviewQuestionId || !interviewId || !jobId || !companyId) {
      return { success: false, error: "Missing required fields" };
    }

    // Check authorization
    const { isAuthorized, error: authError } = await checkCompanyMembership(
      user.id,
      companyId
    );

    if (!isAuthorized) {
      logger.error("User not authorized", { userId: user.id, authError });
      await logger.flush();
      return { success: false, error: authError || t("notAuthorized") };
    }

    // Get the question_id from the link
    const { data: linkData, error: fetchError } = await supabase
      .from("job_interview_questions")
      .select("question_id")
      .eq("id", jobInterviewQuestionId)
      .single();

    if (fetchError || !linkData) {
      logger.error("Failed to fetch question link", { error: fetchError });
      await logger.flush();
      return { success: false, error: "Question not found" };
    }

    // Delete the question from the bank (this will cascade delete all links)
    const { error: deleteError } = await supabase
      .from("company_interview_question_bank")
      .delete()
      .eq("id", linkData.question_id)
      .eq("company_id", companyId);

    if (deleteError) {
      logger.error("Failed to delete question from bank", {
        error: deleteError,
      });
      await logger.flush();
      return { success: false, error: t("failedToDelete") };
    }

    logger.info("Question deleted successfully", {
      jobInterviewQuestionId,
      questionId: linkData.question_id,
    });
    await logger.flush();

    // Revalidate the interview page
    revalidatePath(
      `/recruiting/companies/${companyId}/jobs/${jobId}/interviews/${interviewId}`
    );

    return { success: true };
  } catch (error: any) {
    logger.error("Unexpected error deleting question", {
      error: error.message,
    });
    await logger.flush();
    return { success: false, error: t("unexpectedError") };
  }
}
