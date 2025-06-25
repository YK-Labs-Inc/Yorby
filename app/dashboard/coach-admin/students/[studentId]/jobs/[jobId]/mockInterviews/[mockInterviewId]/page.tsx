import {
  createAdminClient,
  createSupabaseServerClient,
} from "@/utils/supabase/server";
import { Logger } from "next-axiom";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import MockInterviewReview from "@/app/dashboard/jobs/[jobId]/mockInterviews/[mockInterviewId]/review/MockInterviewReview";
import { JobData } from "@/app/dashboard/coach-admin/components/StudentActivitySidebar";
import { posthog } from "@/utils/tracking/serverUtils";
import { Tables } from "@/utils/supabase/database.types";

const fetchStudent = async (studentId: string) => {
  const supabase = await createAdminClient();
  const logger = new Logger().with({ function: "fetchStudent", studentId });
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

const fetchMockInterviewAndRelatedData = async (studentId: string) => {
  const supabase = await createSupabaseServerClient();
  // New enrollment system: fetch using enrollments
  const { data, error } = await supabase
    .from("custom_job_mock_interviews")
    .select("*")
    .eq("user_id", studentId);

  if (error) {
    const logger = new Logger();
    logger.error("Error fetching enrollments", {
      error,
      studentId,
      page: "fetchMockInterviewAndRelatedData",
    });
    return [];
  }

  return data;
};

const fetchAllStudentJobsAndRelatedData = async (
  studentId: string,
  coachId: string
): Promise<JobData[]> => {
  const supabase = await createSupabaseServerClient();
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
              id,
              created_at
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
    logger.error("Error fetching all student jobs for mock interview view", {
      error,
      studentId,
      coachId,
    });
    return [];
  }
  return (data as JobData[]) || [];
};

type AdminStudentMockInterviewViewProps = {
  params: Promise<{
    studentId: string;
    jobId: string;
    mockInterviewId: string;
    locale: string;
  }>;
};

const AdminStudentMockInterviewView = async ({
  params,
}: AdminStudentMockInterviewViewProps) => {
  const t = await getTranslations("AdminStudentMockInterviewView");
  const { studentId, jobId, mockInterviewId } = await params;
  const studentData = await fetchStudent(studentId);
  if (!studentData?.user) return notFound();

  const coach = await fetchCoach();
  if (!coach) return notFound();

  // Check PostHog feature flag
  const useNewEnrollmentSystem = await posthog.isFeatureEnabled(
    "custom-job-enrollments-migration",
    studentId
  );
  await posthog.shutdown();

  let currentMockInterview: Tables<"custom_job_mock_interviews"> | undefined;
  if (useNewEnrollmentSystem) {
    const mockInterview = await fetchMockInterviewAndRelatedData(studentId);
    currentMockInterview = mockInterview.find(
      (mi) => mi.id === mockInterviewId
    );
  } else {
    const allJobsForStudent = await fetchAllStudentJobsAndRelatedData(
      studentId,
      coach.id
    );
    const currentJob = allJobsForStudent.find((j) => j.id === jobId);
    currentMockInterview = currentJob?.custom_job_mock_interviews.find(
      (mi) => mi.id === mockInterviewId
    );
  }

  return (
    <>
      {currentMockInterview && mockInterviewId !== "no-mock-interviews" ? (
        <MockInterviewReview mockInterviewId={currentMockInterview.id} />
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-600 text-lg">{t("noMockInterviewsInJob")}</p>
        </div>
      )}
    </>
  );
};

export default AdminStudentMockInterviewView;
