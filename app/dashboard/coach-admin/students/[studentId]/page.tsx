import { H3 } from "@/components/typography";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Tables } from "@/utils/supabase/database.types";
import { posthog } from "@/utils/tracking/serverUtils";

const AdminStudentPage = async ({
  params,
}: Readonly<{
  params: Promise<{ studentId: string }>;
}>) => {
  const { studentId } = await params;
  const supabase = await createSupabaseServerClient();

  // Check PostHog feature flag
  const useNewEnrollmentSystem = await posthog.isFeatureEnabled(
    "custom-job-enrollments-migration",
    studentId
  );
  await posthog.shutdown();

  let studentCustomJobs: any[];
  let studentCustomJobsError;

  if (useNewEnrollmentSystem) {
    // New enrollment system: fetch using enrollments
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from("custom_job_enrollments")
      .select(
        `*,
        custom_jobs!inner(
          *,
          custom_job_questions(
            *,
            custom_job_question_submissions(*)
          )
        )`
      )
      .eq("user_id", studentId)
      .eq("custom_job_question_submissions.user_id", studentId);

    if (!enrollmentsError && enrollments && enrollments.length > 0) {
      // Extract custom_jobs from enrollments
      studentCustomJobs = enrollments.map(
        (enrollment) => enrollment.custom_jobs
      );
      studentCustomJobsError = null;
    } else {
      studentCustomJobs = [];
      studentCustomJobsError = enrollmentsError;
    }
  } else {
    // Legacy system: fetch directly from custom_jobs
    const legacyResult = await supabase
      .from("custom_jobs")
      .select(
        `id,
        custom_job_questions(
            id,
            custom_job_question_submissions(id)
        )`
      )
      .eq("user_id", studentId);

    studentCustomJobs = legacyResult.data || [];
    studentCustomJobsError = legacyResult.error;
  }

  if (studentCustomJobsError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <H3>No student found</H3>
        <Link href="/dashboard/coach-admin/students">
          <Button>Go back</Button>
        </Link>
      </div>
    );
  }
  if (!studentCustomJobs || studentCustomJobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <H3>No student found</H3>
        <Link href="/dashboard/coach-admin/students">
          <Button>Go back</Button>
        </Link>
      </div>
    );
  }

  // Updated parameter type to QuestionWithSubmissions
  const getQuestionSubmissions = (
    question: Tables<"custom_job_questions"> & {
      custom_job_question_submissions: Tables<"custom_job_question_submissions">[];
    }
  ) => {
    return Array.isArray(question.custom_job_question_submissions)
      ? question.custom_job_question_submissions
      : [];
  };

  const sortedQuestions = [...studentCustomJobs[0].custom_job_questions].sort(
    (a, b) => {
      const submissionsA = getQuestionSubmissions(a);
      const submissionsB = getQuestionSubmissions(b);
      if (submissionsA.length > 0 && submissionsB.length === 0) {
        return -1; // a (with submissions) comes first
      }
      if (submissionsA.length === 0 && submissionsB.length > 0) {
        return 1; // b (with submissions) comes first
      }
      return 0; // Preserve original order for questions with same submission status
    }
  );
  redirect(
    `/dashboard/coach-admin/students/${studentId}/jobs/${studentCustomJobs[0].id}/questions/${sortedQuestions[0].id}`
  );
};

export default AdminStudentPage;
