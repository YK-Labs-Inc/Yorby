import {
  createAdminClient,
  createSupabaseServerClient,
} from "@/utils/supabase/server";
import { Logger } from "next-axiom";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import MockInterviewReview from "@/app/dashboard/jobs/[jobId]/mockInterviews/[mockInterviewId]/review/MockInterviewReview";
import { JobData } from "@/app/dashboard/coach-admin/components/StudentActivitySidebar";

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

const fetchAllStudentJobsAndRelatedData = async (
  studentId: string,
  coachId: string
): Promise<JobData[]> => {
  const supabase = await createSupabaseServerClient();

  // Use new enrollment system
  const useNewEnrollmentSystem = true;

  if (useNewEnrollmentSystem) {
    // New enrollment system: fetch using enrollments
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from("custom_job_enrollments")
      .select(
        `
          custom_jobs!inner(
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
          )
        `
      )
      .eq("user_id", studentId)
      .eq("coach_id", coachId);

    if (enrollmentsError) {
      const logger = new Logger();
      logger.error("Error fetching enrollments for mock interview view", {
        error: enrollmentsError,
        studentId,
        coachId,
      });
      return [];
    }

    if (enrollments && enrollments.length > 0) {
      // Extract custom_jobs from enrollments
      const jobs = enrollments.map((enrollment) => enrollment.custom_jobs);
      return (jobs as JobData[]) || [];
    }
    return [];
  } else {
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
  }
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

  const allJobsForStudent = await fetchAllStudentJobsAndRelatedData(
    studentId,
    coach.id
  );

  const currentJob = allJobsForStudent.find((j) => j.id === jobId);
  const currentMockInterview = currentJob?.custom_job_mock_interviews.find(
    (mi) => mi.id === mockInterviewId
  );

  if (!currentMockInterview) {
    if (
      mockInterviewId === "no-mock-interviews" ||
      !currentJob?.custom_job_mock_interviews ||
      currentJob.custom_job_mock_interviews.length === 0
    ) {
    } else {
      return notFound();
    }
  }

  return (
    <>
      {currentMockInterview && mockInterviewId !== "no-mock-interviews" ? (
        <MockInterviewReview mockInterviewId={currentMockInterview.id} />
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-600 text-lg">
            {currentJob &&
            (currentJob.custom_job_mock_interviews?.length || 0) === 0
              ? t("noMockInterviewsInJob")
              : t("selectMockInterviewToView")}
          </p>
        </div>
      )}
    </>
  );
};

export default AdminStudentMockInterviewView;
