import React from "react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  createAdminClient,
  createSupabaseServerClient,
} from "@/utils/supabase/server";
import StudentActivityHeader from "@/app/[locale]/dashboard/coach-admin/components/StudentActivityHeader";
import StudentActivitySidebar, {
  JobData,
} from "@/app/[locale]/dashboard/coach-admin/components/StudentActivitySidebar";

// Fetch student info
const fetchStudent = async (studentId: string) => {
  const supabase = await createAdminClient();
  const { data, error } = await supabase.auth.admin.getUserById(studentId);
  if (error) return null;
  return data;
};

// Fetch coach info
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

// Fetch all jobs for the student under this coach
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
            created_at,
            custom_job_question_submission_feedback (
              id,
              feedback_role
            )
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
  if (error) return [];
  return (data as JobData[]) || [];
};

function formatDateForHeader(dateString: string) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
    studentId: string;
    jobId: string;
  }>;
}) {
  const { locale, studentId, jobId } = await params;
  const studentData = await fetchStudent(studentId);
  if (!studentData?.user) return notFound();
  const user = studentData.user;
  const name = user.user_metadata?.full_name || user.email || "Unknown";
  const role = user.user_metadata?.role || "";
  const started = formatDateForHeader(user.created_at);
  const t = await getTranslations("AdminStudentView");

  const coach = await fetchCoach();
  if (!coach) return notFound();

  const allJobsForStudent = await fetchAllStudentJobsAndRelatedData(
    studentId,
    coach.id
  );
  if (!allJobsForStudent || allJobsForStudent.length === 0) {
    return (
      <div className="relative w-full min-h-screen bg-white">
        <StudentActivityHeader name={name} role={role} started={started} />
        <div
          className="flex flex-row w-full min-h-0"
          style={{ height: "calc(100vh - 82px)" }}
        >
          <div className="w-80 border-r flex flex-col overflow-y-auto h-full min-h-0 bg-gray-50 p-6">
            <p>{t("noJobsFound")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen bg-white">
      <StudentActivityHeader name={name} role={role} started={started} />
      <div
        className="flex flex-row w-full min-h-0"
        style={{ height: "calc(100vh - 82px)" }}
      >
        <StudentActivitySidebar
          studentId={studentId}
          activeJobId={jobId}
          allJobsForStudent={allJobsForStudent}
          locale={locale}
        />
        <div className="flex-1 px-4 md:px-8 py-6 overflow-y-auto h-full min-h-0">
          {children}
        </div>
      </div>
    </div>
  );
}
