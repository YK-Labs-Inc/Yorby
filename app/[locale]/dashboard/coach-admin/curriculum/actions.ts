"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "@/utils/supabase/database.types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type ActionResponse = {
  success: boolean;
  message: string;
  data?: any;
  error?: any;
};

// Helper function to get coach ID from user ID
async function getCoachId(userId: string): Promise<string | null> {
  const supabase = createServerActionClient<Database>({ cookies });
  
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
async function validateCoach(): Promise<{ userId: string; coachId: string } | null> {
  const supabase = createServerActionClient<Database>({ cookies });
  
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

// Custom Job Actions
export async function createCustomJob(formData: FormData): Promise<ActionResponse> {
  const supabase = createServerActionClient<Database>({ cookies });
  
  // Validate coach
  const coach = await validateCoach();
  if (!coach) {
    return {
      success: false,
      message: "Unauthorized: You must be a coach to perform this action",
    };
  }
  
  // Extract form data
  const jobTitle = formData.get("jobTitle") as string;
  const jobDescription = formData.get("jobDescription") as string;
  const companyName = formData.get("companyName") as string || null;
  const companyDescription = formData.get("companyDescription") as string || null;
  
  // Validate required fields
  if (!jobTitle || !jobDescription) {
    return {
      success: false,
      message: "Job title and description are required",
    };
  }
  
  // Create the custom job
  const { data, error } = await supabase
    .from("custom_jobs")
    .insert({
      job_title: jobTitle,
      job_description: jobDescription,
      company_name: companyName,
      company_description: companyDescription,
      user_id: coach.userId,
      coach_id: coach.coachId,
      status: "unlocked",
    })
    .select()
    .single();
    
  if (error) {
    console.error("Error creating custom job:", error);
    return {
      success: false,
      message: "Failed to create job: " + error.message,
    };
  }
  
  // Revalidate the curriculum page to show the new job
  revalidatePath("/dashboard/coach-admin/curriculum");
  
  return {
    success: true,
    message: "Job created successfully",
    data,
  };
}

export async function updateCustomJob(jobId: string, formData: FormData): Promise<ActionResponse> {
  const supabase = createServerActionClient<Database>({ cookies });
  
  // Validate coach
  const coach = await validateCoach();
  if (!coach) {
    return {
      success: false,
      message: "Unauthorized: You must be a coach to perform this action",
    };
  }
  
  // Extract form data
  const jobTitle = formData.get("jobTitle") as string;
  const jobDescription = formData.get("jobDescription") as string;
  const companyName = formData.get("companyName") as string || null;
  const companyDescription = formData.get("companyDescription") as string || null;
  
  // Validate required fields
  if (!jobTitle || !jobDescription) {
    return {
      success: false,
      message: "Job title and description are required",
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
      message: "Job not found or you don't have permission to edit it",
    };
  }
  
  // Update the custom job
  const { data, error } = await supabase
    .from("custom_jobs")
    .update({
      job_title: jobTitle,
      job_description: jobDescription,
      company_name: companyName,
      company_description: companyDescription,
    })
    .eq("id", jobId)
    .eq("coach_id", coach.coachId)
    .select()
    .single();
    
  if (error) {
    console.error("Error updating custom job:", error);
    return {
      success: false,
      message: "Failed to update job: " + error.message,
    };
  }
  
  // Revalidate the curriculum pages
  revalidatePath("/dashboard/coach-admin/curriculum");
  revalidatePath(`/dashboard/coach-admin/curriculum/${jobId}`);
  
  return {
    success: true,
    message: "Job updated successfully",
    data,
  };
}

export async function deleteCustomJob(jobId: string): Promise<ActionResponse> {
  const supabase = createServerActionClient<Database>({ cookies });
  
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
      message: "Job not found or you don't have permission to delete it",
    };
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
    console.error("Error deleting custom job:", error);
    return {
      success: false,
      message: "Failed to delete job: " + error.message,
    };
  }
  
  // Revalidate the curriculum page
  revalidatePath("/dashboard/coach-admin/curriculum");
  
  // Redirect to the curriculum listing page
  redirect("/dashboard/coach-admin/curriculum");
  
  return {
    success: true,
    message: "Job deleted successfully",
  };
}

// Question Actions
export async function createQuestion(jobId: string, formData: FormData): Promise<ActionResponse> {
  const supabase = createServerActionClient<Database>({ cookies });
  
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
  const questionType = formData.get("questionType") as "ai_generated" | "user_generated" || "user_generated";
  
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
      message: "Job not found or you don't have permission to add questions to it",
    };
  }
  
  // Create the question
  const { data, error } = await supabase
    .from("custom_job_questions")
    .insert({
      question,
      answer_guidelines: answerGuidelines,
      custom_job_id: jobId,
      question_type: questionType,
    })
    .select()
    .single();
    
  if (error) {
    console.error("Error creating question:", error);
    return {
      success: false,
      message: "Failed to create question: " + error.message,
    };
  }
  
  // Revalidate the job page to show the new question
  revalidatePath(`/dashboard/coach-admin/curriculum/${jobId}`);
  
  return {
    success: true,
    message: "Question created successfully",
    data,
  };
}

export async function updateQuestion(
  jobId: string,
  questionId: string,
  formData: FormData
): Promise<ActionResponse> {
  const supabase = createServerActionClient<Database>({ cookies });
  
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
  const questionType = formData.get("questionType") as "ai_generated" | "user_generated" || "user_generated";
  
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
      message: "Job not found or you don't have permission to edit questions in it",
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
  revalidatePath(`/dashboard/coach-admin/curriculum/${jobId}/questions/${questionId}`);
  
  return {
    success: true,
    message: "Question updated successfully",
    data,
  };
}

export async function deleteQuestion(jobId: string, questionId: string): Promise<ActionResponse> {
  const supabase = createServerActionClient<Database>({ cookies });
  
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
      message: "Job not found or you don't have permission to delete questions from it",
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
  formData: FormData
): Promise<ActionResponse> {
  const supabase = createServerActionClient<Database>({ cookies });
  
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
      message: "Job not found or you don't have permission to add sample answers to it",
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
  revalidatePath(`/dashboard/coach-admin/curriculum/${jobId}/questions/${questionId}`);
  
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
  formData: FormData
): Promise<ActionResponse> {
  const supabase = createServerActionClient<Database>({ cookies });
  
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
      message: "Job not found or you don't have permission to edit sample answers in it",
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
  revalidatePath(`/dashboard/coach-admin/curriculum/${jobId}/questions/${questionId}`);
  
  return {
    success: true,
    message: "Sample answer updated successfully",
    data,
  };
}

export async function deleteSampleAnswer(
  jobId: string,
  questionId: string,
  answerId: string
): Promise<ActionResponse> {
  const supabase = createServerActionClient<Database>({ cookies });
  
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
      message: "Job not found or you don't have permission to delete sample answers from it",
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
  revalidatePath(`/dashboard/coach-admin/curriculum/${jobId}/questions/${questionId}`);
  
  return {
    success: true,
    message: "Sample answer deleted successfully",
  };
}
