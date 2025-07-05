import {
  createAdminClient,
  createSupabaseServerClient,
} from "@/utils/supabase/server";
import { Logger } from "next-axiom";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import StudentQuestionSubmissions from "./StudentQuestionSubmissions";
import {
  JobData,
  QuestionWithSubmissions,
} from "@/app/dashboard/coach-admin/components/StudentActivitySidebar";
import { Tables } from "@/utils/supabase/database.types";

const fetchStudent = async (studentId: string) => {
  const supabase = await createAdminClient();
  const logger = new Logger().with({
    function: "fetchStudent",
    studentId,
  });
  const { data, error } = await supabase.auth.admin.getUserById(studentId);
  if (error) {
    logger.error(error.message);
    return null;
  }
  return data;
};

const fetchCoach = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: coachUser },
  } = await supabase.auth.getUser();
  if (!coachUser) return null;
  const { data: coach } = await supabase
    .from("coaches")
    .select("id")
    .eq("user_id", coachUser.id)
    .single();
  return coach;
};

const fetchAllStudentJobsAndRelatedData = async (
  studentId: string,
  coachId: string
): Promise<JobData[]> => {
  const supabase = await createSupabaseServerClient();
  // Legacy system: fetch directly from custom_jobs
  const { data, error } = await supabase
    .from("custom_jobs")
    .select(
      `
          id,
          job_title,
          custom_job_questions (
            id,
            question,
            created_at,
            custom_job_question_submissions (
              *,
              custom_job_question_submission_feedback(*),
              mux_metadata:custom_job_question_submission_mux_metadata(*)
            )
          ),
          custom_job_mock_interviews (
            id,
            created_at,
            status
          )
      `
    )
    .eq("user_id", studentId)
    .eq("coach_id", coachId)
    .order("created_at", { ascending: false });

  if (error) {
    const logger = new Logger();
    logger.error("Error fetching all student jobs", {
      error,
      studentId,
      coachId,
    });
    return [];
  }
  return (data as JobData[]) || [];
};

const AdminStudentQuestionViewPage = async ({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{
    questionId: string;
    studentId: string;
    jobId: string;
    locale: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}>) => {
  const t = await getTranslations("AdminStudentView");

  const { questionId, studentId, jobId } = await params;
  const { submissionId } = await searchParams;

  const studentData = await fetchStudent(studentId);
  if (!studentData?.user) {
    return notFound();
  }

  const coach = await fetchCoach();
  if (!coach) {
    return notFound();
  }

  // Legacy system: fetch directly from custom_jobs
  const allJobsForStudent = await fetchAllStudentJobsAndRelatedData(
    studentId,
    coach.id
  );
  const currentJob = allJobsForStudent.find((j) => j.id === jobId);
  const currentQuestion = currentJob?.custom_job_questions.find(
    (q: QuestionWithSubmissions) => q.id === questionId
  );
  const submissions = currentQuestion
    ? Array.isArray(currentQuestion.custom_job_question_submissions)
      ? currentQuestion.custom_job_question_submissions
      : []
    : [];
  const currentSubmission =
    submissions.find((s) => s.id === submissionId) ||
    (submissions.length > 0 ? submissions[0] : null);

  // Fetch coach feedback for this submission (feedback_role === 'user')
  let currentCoachFeedback = null;
  if (currentSubmission) {
    try {
      const supabase = await createSupabaseServerClient();
      const { data: feedbackRows } = await supabase
        .from("custom_job_question_submission_feedback")
        .select("*")
        .eq("submission_id", currentSubmission.id)
        .eq("feedback_role", "user")
        .maybeSingle();
      currentCoachFeedback = feedbackRows || null;
    } catch (e) {
      currentCoachFeedback = null;
    }
  }

  return (
    <>
      {currentQuestion && questionId !== "no-questions" ? (
        <StudentQuestionSubmissions
          studentId={studentId}
          jobId={jobId}
          questionId={questionId}
          question={currentQuestion as QuestionWithSubmissions}
          submissions={submissions}
          currentSubmissionId={submissionId as string}
          currentSubmission={currentSubmission}
          currentCoachFeedback={currentCoachFeedback}
        />
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-600 text-lg">{t("noQuestionsInJob")}</p>
        </div>
      )}
    </>
  );
};

export default AdminStudentQuestionViewPage;
