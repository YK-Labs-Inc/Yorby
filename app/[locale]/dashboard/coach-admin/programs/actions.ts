"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Logger } from "next-axiom";
import { getTranslations } from "next-intl/server";

type ActionResponse = {
  success: boolean;
  message: string;
  data?: any;
  error?: any;
};

// Helper function to get coach ID from user ID
async function getCoachId(userId: string): Promise<string | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("coaches")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    console.error("Error fetching coach ID:", error);
    return null;
  }

  return data.id;
}

// Helper function to check if a user is authorized as a coach
export async function validateCoach(): Promise<
  { userId: string; coachId: string } | null
> {
  const supabase = await createSupabaseServerClient();

  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Get the coach ID
  const coachId = await getCoachId(user.id);

  if (!coachId) {
    return null;
  }

  return { userId: user.id, coachId };
}

export const deleteCustomJob = async (jobId: string) => {
  const t = await getTranslations("errors");
  const supabase = await createSupabaseServerClient();
  const logger = new Logger().with({ function: "deleteCustomJob", jobId });

  // Validate coach
  const coach = await validateCoach();
  if (!coach) {
    logger.error("Unauthorized: You must be a coach to perform this action");
    await logger.flush();
    redirect(
      `/dashboard/coach-admin/programs/${jobId}/delete?error_message=${
        t("noPermission")
      }`,
    );
  }

  // Verify the job belongs to this coach
  const { data: jobData, error: jobError } = await supabase
    .from("custom_jobs")
    .select()
    .eq("id", jobId)
    .eq("coach_id", coach.coachId)
    .single();

  if (jobError || !jobData) {
    logger.error("Program not found");
    await logger.flush();
    redirect(
      `/dashboard/coach-admin/programs/${jobId}/delete?error_message=${
        t("noPermission")
      }`,
    );
  }

  // Delete the custom job
  // Note: This will cascade delete related questions and sample answers
  // if the database is set up with the proper foreign key constraints
  const { error } = await supabase
    .from("custom_jobs")
    .delete()
    .eq("id", jobId)
    .eq("coach_id", coach.coachId);

  if (error) {
    logger.error("Error deleting custom job:", error);
    await logger.flush();
    redirect(
      `/dashboard/coach-admin/programs/${jobId}/delete?error_message=${
        t("pleaseTryAgain")
      }`,
    );
  }

  // Revalidate the curriculum page
  revalidatePath("/dashboard/coach-admin/programs");
  redirect(
    `/dashboard/coach-admin/programs`,
  );
};

export async function updateQuestion(
  jobId: string,
  questionId: string,
  formData: FormData,
): Promise<ActionResponse> {
  const supabase = await createSupabaseServerClient();

  // Validate coach
  const coach = await validateCoach();
  if (!coach) {
    return {
      success: false,
      message: "Unauthorized: You must be a coach to perform this action",
    };
  }

  // Extract form data
  const question = formData.get("question") as string;
  const answerGuidelines = formData.get("answerGuidelines") as string;
  const questionType =
    formData.get("questionType") as "ai_generated" | "user_generated" ||
    "user_generated";

  // Validate required fields
  if (!question || !answerGuidelines) {
    return {
      success: false,
      message: "Question and answer guidelines are required",
    };
  }

  // Verify the job belongs to this coach
  const { data: jobData, error: jobError } = await supabase
    .from("custom_jobs")
    .select()
    .eq("id", jobId)
    .eq("coach_id", coach.coachId)
    .single();

  if (jobError || !jobData) {
    return {
      success: false,
      message:
        "Job not found or you don't have permission to edit questions in it",
    };
  }

  // Verify the question belongs to this job
  const { data: questionData, error: questionError } = await supabase
    .from("custom_job_questions")
    .select()
    .eq("id", questionId)
    .eq("custom_job_id", jobId)
    .single();

  if (questionError || !questionData) {
    return {
      success: false,
      message: "Question not found or doesn't belong to this job",
    };
  }

  // Update the question
  const { data, error } = await supabase
    .from("custom_job_questions")
    .update({
      question,
      answer_guidelines: answerGuidelines,
      question_type: questionType,
    })
    .eq("id", questionId)
    .eq("custom_job_id", jobId)
    .select()
    .single();

  if (error) {
    console.error("Error updating question:", error);
    return {
      success: false,
      message: "Failed to update question: " + error.message,
    };
  }

  // Revalidate the job page and question page
  revalidatePath(`/dashboard/coach-admin/curriculum/${jobId}`);
  revalidatePath(
    `/dashboard/coach-admin/curriculum/${jobId}/questions/${questionId}`,
  );

  return {
    success: true,
    message: "Question updated successfully",
    data,
  };
}
