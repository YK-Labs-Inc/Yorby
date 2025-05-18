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

export async function deleteQuestion(
  jobId: string,
  questionId: string,
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
        "Job not found or you don't have permission to delete questions from it",
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

  // Delete the question
  // Note: This will cascade delete related sample answers
  // if the database is set up with the proper foreign key constraints
  const { error } = await supabase
    .from("custom_job_questions")
    .delete()
    .eq("id", questionId)
    .eq("custom_job_id", jobId);

  if (error) {
    console.error("Error deleting question:", error);
    return {
      success: false,
      message: "Failed to delete question: " + error.message,
    };
  }

  // Revalidate the job page
  revalidatePath(`/dashboard/coach-admin/curriculum/${jobId}`);

  return {
    success: true,
    message: "Question deleted successfully",
  };
}

// Sample Answer Actions
export async function createSampleAnswer(
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
  const answer = formData.get("answer") as string;

  // Validate required fields
  if (!answer) {
    return {
      success: false,
      message: "Sample answer is required",
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
        "Job not found or you don't have permission to add sample answers to it",
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

  // Create the sample answer
  const { data, error } = await supabase
    .from("custom_job_question_sample_answers")
    .insert({
      answer,
      question_id: questionId,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating sample answer:", error);
    return {
      success: false,
      message: "Failed to create sample answer: " + error.message,
    };
  }

  // Revalidate the question page to show the new sample answer
  revalidatePath(
    `/dashboard/coach-admin/curriculum/${jobId}/questions/${questionId}`,
  );

  return {
    success: true,
    message: "Sample answer created successfully",
    data,
  };
}

export async function updateSampleAnswer(
  jobId: string,
  questionId: string,
  answerId: string,
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
  const answer = formData.get("answer") as string;

  // Validate required fields
  if (!answer) {
    return {
      success: false,
      message: "Sample answer is required",
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
        "Job not found or you don't have permission to edit sample answers in it",
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

  // Verify the sample answer belongs to this question
  const { data: answerData, error: answerError } = await supabase
    .from("custom_job_question_sample_answers")
    .select()
    .eq("id", answerId)
    .eq("question_id", questionId)
    .single();

  if (answerError || !answerData) {
    return {
      success: false,
      message: "Sample answer not found or doesn't belong to this question",
    };
  }

  // Update the sample answer
  const { data, error } = await supabase
    .from("custom_job_question_sample_answers")
    .update({
      answer,
    })
    .eq("id", answerId)
    .eq("question_id", questionId)
    .select()
    .single();

  if (error) {
    console.error("Error updating sample answer:", error);
    return {
      success: false,
      message: "Failed to update sample answer: " + error.message,
    };
  }

  // Revalidate the question page
  revalidatePath(
    `/dashboard/coach-admin/curriculum/${jobId}/questions/${questionId}`,
  );

  return {
    success: true,
    message: "Sample answer updated successfully",
    data,
  };
}

export async function deleteSampleAnswer(
  jobId: string,
  questionId: string,
  answerId: string,
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
        "Job not found or you don't have permission to delete sample answers from it",
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

  // Verify the sample answer belongs to this question
  const { data: answerData, error: answerError } = await supabase
    .from("custom_job_question_sample_answers")
    .select()
    .eq("id", answerId)
    .eq("question_id", questionId)
    .single();

  if (answerError || !answerData) {
    return {
      success: false,
      message: "Sample answer not found or doesn't belong to this question",
    };
  }

  // Delete the sample answer
  const { error } = await supabase
    .from("custom_job_question_sample_answers")
    .delete()
    .eq("id", answerId)
    .eq("question_id", questionId);

  if (error) {
    console.error("Error deleting sample answer:", error);
    return {
      success: false,
      message: "Failed to delete sample answer: " + error.message,
    };
  }

  // Revalidate the question page
  revalidatePath(
    `/dashboard/coach-admin/curriculum/${jobId}/questions/${questionId}`,
  );

  return {
    success: true,
    message: "Sample answer deleted successfully",
  };
}
