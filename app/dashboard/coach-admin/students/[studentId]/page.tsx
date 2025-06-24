import { H3 } from "@/components/typography";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Tables } from "@/utils/supabase/database.types";

const AdminStudentPage = async ({
  params,
}: Readonly<{
  params: Promise<{ studentId: string }>;
}>) => {
  const { studentId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: studentCustomJobs, error: studentCustomJobsError } =
    await supabase
      .from("custom_jobs")
      .select(
        `*,
        custom_job_questions(
            *,
            custom_job_question_submissions(*)
        )`
      )
      .eq("user_id", studentId);
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
  if (studentCustomJobs.length === 0) {
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
