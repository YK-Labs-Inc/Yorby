import {
  createAdminClient,
  createSupabaseServerClient,
} from "@/utils/supabase/server";
import { Logger } from "next-axiom";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import MockInterviewReview from "@/app/dashboard/jobs/[jobId]/mockInterviews/[mockInterviewId]/review/MockInterviewReview";
import { JobData } from "@/app/dashboard/coach-admin/components/StudentActivitySidebar";
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

  // Use new enrollment system
  const mockInterview = await fetchMockInterviewAndRelatedData(studentId);
  const currentMockInterview = mockInterview.find(
    (mi) => mi.id === mockInterviewId
  );

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
