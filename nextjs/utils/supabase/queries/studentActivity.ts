import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Tables } from "@/utils/supabase/database.types";
import { cache } from "react";

export interface EnrolledJob {
  id: string;
  job_title: string;
  questionsCount?: number;
  mockInterviewsCount?: number;
}

export const fetchStudentEnrolledJobs = cache(async (
  studentId: string,
  coachId: string,
): Promise<EnrolledJob[]> => {
  const supabase = await createSupabaseServerClient();

  const { data: enrollments, error } = await supabase
    .from("custom_job_enrollments")
    .select(
      `
      custom_jobs!inner(
        id,
        job_title
      )
    `,
    )
    .eq("user_id", studentId)
    .eq("coach_id", coachId);

  if (error || !enrollments) return [];

  return enrollments.map((enrollment) => ({
    id: enrollment.custom_jobs.id,
    job_title: enrollment.custom_jobs.job_title,
  }));
});

export const fetchJobQuestions = cache(async (
  jobId: string,
): Promise<Tables<"custom_job_questions">[]> => {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("custom_job_questions")
    .select("*")
    .eq("custom_job_id", jobId)
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return data;
});

export const fetchQuestionSubmissions = cache(async (
  questionIds: string[],
  userId: string,
): Promise<
  Record<
    string,
    Array<
      Tables<"custom_job_question_submissions"> & {
        hasCoachFeedback?: boolean;
      }
    >
  >
> => {
  if (questionIds.length === 0) return {};

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("custom_job_question_submissions")
    .select(
      `
      *,
      custom_job_question_submission_feedback (
        id,
        feedback_role
      )
    `,
    )
    .in("custom_job_question_id", questionIds)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return {};

  // Group submissions by question ID
  const submissionsByQuestion: Record<string, any[]> = {};

  data.forEach((submission) => {
    const questionId = submission.custom_job_question_id;
    if (!submissionsByQuestion[questionId]) {
      submissionsByQuestion[questionId] = [];
    }

    const hasCoachFeedback = submission.custom_job_question_submission_feedback
      ?.some(
        (fb: any) => fb.feedback_role === "user",
      );

    submissionsByQuestion[questionId].push({
      ...submission,
      hasCoachFeedback,
    });
  });

  return submissionsByQuestion;
});

export const fetchJobMockInterviews = cache(async (
  jobId: string,
  studentId: string,
): Promise<Tables<"custom_job_mock_interviews">[]> => {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("custom_job_mock_interviews")
    .select("*")
    .eq("custom_job_id", jobId)
    .eq("user_id", studentId)
    .eq("status", "complete")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data;
});

export const fetchJobCounts = cache(async (
  jobIds: string[],
): Promise<
  Record<string, { questionsCount: number; mockInterviewsCount: number }>
> => {
  if (jobIds.length === 0) return {};

  const supabase = await createSupabaseServerClient();

  // Fetch question counts
  const { data: questionCounts } = await supabase
    .from("custom_job_questions")
    .select("custom_job_id")
    .in("custom_job_id", jobIds);

  // Fetch mock interview counts
  const { data: mockInterviewCounts } = await supabase
    .from("custom_job_mock_interviews")
    .select("custom_job_id")
    .eq("status", "complete")
    .in("custom_job_id", jobIds);

  // Count by job ID
  const counts: Record<
    string,
    { questionsCount: number; mockInterviewsCount: number }
  > = {};

  jobIds.forEach((jobId) => {
    counts[jobId] = {
      questionsCount: questionCounts?.filter((q) =>
        q.custom_job_id === jobId
      ).length || 0,
      mockInterviewsCount: mockInterviewCounts?.filter((m) =>
        m.custom_job_id === jobId
      ).length || 0,
    };
  });

  return counts;
});
