"use server";

import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Logger } from "next-axiom";
import { revalidatePath } from "next/cache";
import { Tables } from "@/utils/supabase/database.types";
import { getTranslations } from "next-intl/server";

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
    const { isAuthorized, error: authError } = await checkCompanyMembership(
      user.id,
      jobId
    );

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
    revalidatePath(`/dashboard/jobs/${jobId}`);

    return { success: true, data };
  } catch (error: any) {
    logger.error("Unexpected error creating question", { error: error.message });
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
    const { isAuthorized, error: authError } = await checkCompanyMembership(
      user.id,
      jobId
    );

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
    revalidatePath(`/dashboard/jobs/${jobId}`);

    return { success: true, data };
  } catch (error: any) {
    logger.error("Unexpected error updating question", { error: error.message });
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
    const { isAuthorized, error: authError } = await checkCompanyMembership(
      user.id,
      jobId
    );

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
    revalidatePath(`/dashboard/jobs/${jobId}`);

    return { success: true };
  } catch (error: any) {
    logger.error("Unexpected error deleting question", { error: error.message });
    await logger.flush();
    return { success: false, error: t("unexpectedError") };
  }
}