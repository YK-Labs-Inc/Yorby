"use server";

import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Logger } from "next-axiom";
import { revalidatePath } from "next/cache";
import { Tables } from "@/utils/supabase/database.types";
import { getTranslations } from "next-intl/server";
import type { Question } from "./AIChatPanel";

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
    const {
      data: { user },
    } = await supabase.auth.getUser();

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

    // Step 2: Get the next order index
    const nextOrderIndex = await getNextOrderIndex(interviewId);

    // Step 3: Link the question to the interview
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
    const {
      data: { user },
    } = await supabase.auth.getUser();

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
    if (
      !questionId ||
      !question ||
      !answer ||
      !interviewId ||
      !jobId ||
      !companyId
    ) {
      return {
        success: false,
        error: t("missingRequiredFields") || "Missing required fields",
      };
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
    const {
      data: { user },
    } = await supabase.auth.getUser();

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

export type SaveQuestionsState = {
  error?: string;
  success?: boolean;
};

export async function saveQuestions(
  prevState: SaveQuestionsState | null,
  formData: FormData
): Promise<SaveQuestionsState> {
  const logger = new Logger().with({
    function: "saveQuestions",
  });

  try {
    const supabase = await createSupabaseServerClient();

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      logger.error("Authentication error", { error: userError });
      await logger.flush();
      return { error: "You must be logged in to save questions" };
    }

    // Get questions and IDs from formData
    const questionsJson = formData.get("questions");
    const jobId = formData.get("jobId");
    const companyId = formData.get("companyId");
    const interviewId = formData.get("interviewId");

    if (!questionsJson || !jobId || !companyId || !interviewId) {
      return { error: "Missing required data" };
    }

    const questions: Question[] = JSON.parse(questionsJson as string);

    // Check authorization
    const { isAuthorized, error: authError } = await checkCompanyMembership(
      user.id,
      companyId as string
    );

    if (!isAuthorized) {
      logger.error("User not authorized", { userId: user.id, authError });
      await logger.flush();
      return {
        error: authError || "You don't have permission to manage questions",
      };
    }

    // Get interview type
    const { data: interview, error: interviewError } = await supabase
      .from("job_interviews")
      .select("interview_type")
      .eq("id", interviewId as string)
      .single();

    if (interviewError || !interview) {
      logger.error("Interview not found", { error: interviewError });
      await logger.flush();
      return { error: "Interview not found" };
    }

    // Filter out questions without required fields
    const validQuestions = questions.filter(
      (q): q is Question & { question: string; answer: string } =>
        q.question !== null &&
        q.question !== undefined &&
        q.question.trim() !== "" &&
        q.answer !== null &&
        q.answer !== undefined &&
        q.answer.trim() !== ""
    );

    if (validQuestions.length === 0) {
      logger.warn("No valid questions to save", {
        originalCount: questions.length,
        userId: user.id,
      });
      await logger.flush();
      return {
        error:
          "No valid questions to save. Please ensure all questions have content.",
      };
    }

    // Get the starting order index
    let currentOrderIndex = await getNextOrderIndex(interviewId as string);

    // Insert questions in bulk to the bank
    const questionsToInsert = validQuestions.map((q) => ({
      company_id: companyId as string,
      question: q.question.trim(),
      answer: q.answer.trim(),
      question_type: interview.interview_type,
    }));

    const { data: insertedQuestions, error: insertError } = await supabase
      .from("company_interview_question_bank")
      .insert(questionsToInsert)
      .select();

    if (insertError || !insertedQuestions) {
      logger.error("Failed to insert questions to bank", {
        error: insertError,
        questionsCount: validQuestions.length,
      });
      await logger.flush();
      return { error: "Failed to save questions. Please try again." };
    }

    // Link all questions to the interview
    const linksToInsert = insertedQuestions.map((q, index) => ({
      interview_id: interviewId as string,
      question_id: q.id,
      order_index: currentOrderIndex + index,
    }));

    const { error: linkError } = await supabase
      .from("job_interview_questions")
      .insert(linksToInsert);

    if (linkError) {
      // Rollback: delete the questions from the bank
      const questionIds = insertedQuestions.map((q) => q.id);
      await supabase
        .from("company_interview_question_bank")
        .delete()
        .in("id", questionIds);

      logger.error("Failed to link questions to interview", {
        error: linkError,
      });
      await logger.flush();
      return { error: "Failed to save questions. Please try again." };
    }

    logger.info("Questions saved successfully", {
      interviewId,
      questionsCount: insertedQuestions.length,
      userId: user.id,
    });
    await logger.flush();

    // Revalidate the questions page
    revalidatePath(
      `/recruiting/companies/${companyId}/jobs/${jobId}/interviews/${interviewId}`
    );

    return { success: true };
  } catch (error) {
    logger.error("Unexpected error saving questions", {
      error: error instanceof Error ? error.message : String(error),
    });
    await logger.flush();
    return { error: "An unexpected error occurred. Please try again." };
  }
}
