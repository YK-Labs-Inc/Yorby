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
  jobId: string
): Promise<{ isAuthorized: boolean; companyId?: string; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const t = await getTranslations("recruiting.questionsTable.actions.errors");

  // First get the job to see if it has a company_id
  const { data: job, error: jobError } = await supabase
    .from("custom_jobs")
    .select("id, user_id, company_id")
    .eq("id", jobId)
    .single();

  if (jobError || !job) {
    return { isAuthorized: false, error: t("jobNotFound") };
  }

  // If no company_id, check if user owns the job
  if (!job.company_id) {
    return { isAuthorized: job.user_id === userId };
  }

  // Check if user is a member of the company
  const { data: membership, error: memberError } = await supabase
    .from("company_members")
    .select("role")
    .eq("company_id", job.company_id)
    .eq("user_id", userId)
    .single();

  if (memberError || !membership) {
    return { isAuthorized: false, error: t("notAuthorizedToManage") };
  }

  // Only owners, admins, and recruiters can manage questions
  const authorizedRoles = ["owner", "admin", "recruiter"];
  return {
    isAuthorized: authorizedRoles.includes(membership.role),
    companyId: job.company_id,
  };
}

export async function createQuestion(
  jobId: string,
  questionData: {
    question: string;
    answer_guidelines: string;
    publication_status: "published" | "draft";
    question_type: "user_generated";
  }
) {
  const logger = new Logger().with({
    function: "createQuestion",
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
    const {
      isAuthorized,
      companyId,
      error: authError,
    } = await checkCompanyMembership(user.id, jobId);
    if (!companyId) {
      return { success: false, error: t("notAuthorized") };
    }

    if (!isAuthorized) {
      logger.error("User not authorized", { userId: user.id, authError });
      await logger.flush();
      return { success: false, error: authError || t("notAuthorized") };
    }

    // Create the question
    const { data, error } = await supabase
      .from("custom_job_questions")
      .insert({
        custom_job_id: jobId,
        ...questionData,
      })
      .select()
      .single();

    if (error) {
      logger.error("Failed to create question", { error });
      await logger.flush();
      return { success: false, error: t("failedToCreate") };
    }

    logger.info("Question created successfully", { questionId: data.id });
    await logger.flush();

    // Revalidate the job page
    revalidatePath(
      `/recruiting/companies/${companyId}/jobs/${jobId}/questions`
    );

    return { success: true, data };
  } catch (error: any) {
    logger.error("Unexpected error creating question", {
      error: error.message,
    });
    await logger.flush();
    return { success: false, error: t("unexpectedError") };
  }
}

export async function updateQuestion(
  questionId: string,
  jobId: string,
  updates: {
    question: string;
    answer_guidelines: string;
    publication_status: "published" | "draft";
  }
) {
  const logger = new Logger().with({
    function: "updateQuestion",
    questionId,
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
    const {
      isAuthorized,
      companyId,
      error: authError,
    } = await checkCompanyMembership(user.id, jobId);

    if (!companyId) {
      return { success: false, error: t("notAuthorized") };
    }

    if (!isAuthorized) {
      logger.error("User not authorized", { userId: user.id, authError });
      await logger.flush();
      return { success: false, error: authError || t("notAuthorized") };
    }

    // Update the question
    const { data, error } = await supabase
      .from("custom_job_questions")
      .update(updates)
      .eq("id", questionId)
      .eq("custom_job_id", jobId) // Extra safety check
      .select()
      .single();

    if (error) {
      logger.error("Failed to update question", { error });
      await logger.flush();
      return { success: false, error: t("failedToUpdate") };
    }

    logger.info("Question updated successfully", { questionId });
    await logger.flush();

    // Revalidate the job page
    revalidatePath(
      `/recruiting/companies/${companyId}/jobs/${jobId}/questions`
    );
    return { success: true, data };
  } catch (error: any) {
    logger.error("Unexpected error updating question", {
      error: error.message,
    });
    await logger.flush();
    return { success: false, error: t("unexpectedError") };
  }
}

export async function deleteQuestion(questionId: string, jobId: string) {
  const logger = new Logger().with({
    function: "deleteQuestion",
    questionId,
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
    const {
      isAuthorized,
      companyId,
      error: authError,
    } = await checkCompanyMembership(user.id, jobId);

    if (!companyId) {
      return { success: false, error: t("notAuthorized") };
    }

    if (!isAuthorized) {
      logger.error("User not authorized", { userId: user.id, authError });
      await logger.flush();
      return { success: false, error: authError || t("notAuthorized") };
    }

    // Check if question has submissions
    const { data: submissions, error: submissionsError } = await supabase
      .from("custom_job_question_submissions")
      .select("id")
      .eq("custom_job_question_id", questionId)
      .limit(1);

    if (submissionsError) {
      logger.error("Failed to check submissions", { error: submissionsError });
      await logger.flush();
      return { success: false, error: t("failedToCheckSubmissions") };
    }

    if (submissions && submissions.length > 0) {
      logger.warn("Cannot delete question with submissions", {
        questionId,
        submissionCount: submissions.length,
      });
      await logger.flush();
      return {
        success: false,
        error: t("cannotDeleteWithSubmissions"),
      };
    }

    // Delete the question
    const { error } = await supabase
      .from("custom_job_questions")
      .delete()
      .eq("id", questionId)
      .eq("custom_job_id", jobId); // Extra safety check

    if (error) {
      logger.error("Failed to delete question", { error });
      await logger.flush();
      return { success: false, error: t("failedToDelete") };
    }

    logger.info("Question deleted successfully", { questionId });
    await logger.flush();

    // Revalidate the job page
    revalidatePath(
      `/recruiting/companies/${companyId}/jobs/${jobId}/questions`
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

    // Get questions and jobId from formData
    const questionsJson = formData.get("questions");
    const jobId = formData.get("jobId");
    const companyId = formData.get("companyId");

    if (!questionsJson || !jobId || !companyId) {
      return { error: "Missing required data" };
    }

    const questions: Question[] = JSON.parse(questionsJson as string);

    // Check authorization using existing helper
    const { isAuthorized, error: authError } = await checkCompanyMembership(
      user.id,
      jobId as string
    );

    if (!isAuthorized) {
      logger.error("User not authorized", { userId: user.id, authError });
      await logger.flush();
      return {
        error: authError || "You don't have permission to manage questions",
      };
    }

    // Filter out questions without required fields and prepare for insert
    const questionsToInsert = questions
      .filter(
        (q): q is Question & { question: string } =>
          q.question !== null &&
          q.question !== undefined &&
          q.question.trim() !== ""
      )
      .map((q) => ({
        custom_job_id: jobId as string,
        question: q.question.trim(),
        answer_guidelines: q.answer_guidelines || "",
        question_type: q.question_type ?? "ai_generated",
        publication_status: q.publication_status || "published",
      }));

    if (questionsToInsert.length === 0) {
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

    const { error: insertError } = await supabase
      .from("custom_job_questions")
      .insert(questionsToInsert);

    if (insertError) {
      logger.error("Failed to insert questions", {
        error: insertError,
        questionsCount: questions.length,
      });
      await logger.flush();
      return { error: "Failed to save questions. Please try again." };
    }

    logger.info("Questions saved successfully", {
      jobId,
      questionsCount: questionsToInsert.length,
      originalCount: questions.length,
      userId: user.id,
    });
    await logger.flush();

    // Revalidate the questions page
    revalidatePath(
      `/recruiting/companies/${companyId}/jobs/${jobId}/questions`
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
