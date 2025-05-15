import { createAdminClient } from "@/utils/supabase/server";
import { Logger } from "next-axiom";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Tables } from "@/utils/supabase/database.types";
import StudentQuestionSubmissions from "./StudentQuestionSubmissions";
import { useSearchParams } from "next/navigation";

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
  if (!coachUser) return notFound();
  const { data: coach } = await supabase
    .from("coaches")
    .select("id")
    .eq("user_id", coachUser.id)
    .single();
  if (!coach) return notFound();
  return coach;
};

const fetchCustomJobs = async (studentId: string) => {
  const supabase = await createSupabaseServerClient();
  const coach = await fetchCoach();
  const coachId = coach.id;
  const { data: customJobs, error } = await supabase
    .from("custom_jobs")
    .select(
      `
        *,
        custom_job_questions (
          *,
          custom_job_question_submissions (
            *
          )
        )
    `
    )
    .eq("user_id", studentId)
    .eq("coach_id", coachId)
    .order("created_at", { ascending: false });
  if (error) {
    return [];
  }
  return customJobs;
};

const AdminStudentView = async ({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ studentId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}>) => {
  const t = await getTranslations("AdminStudentHeader");
  const tAdmin = await getTranslations("AdminStudentView");
  const { studentId } = await params;
  const student = await fetchStudent(studentId);
  if (!student) {
    return notFound();
  }
  const user = student.user;
  const name = user.user_metadata?.full_name || user.email || tAdmin("unknown");
  const role = user.user_metadata?.role || "";
  const cohort = user.user_metadata?.cohort || "";
  function formatDate(dateString: string) {
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
  const started = formatDate(user.created_at);

  const customJobs = await fetchCustomJobs(studentId);
  if (!customJobs || customJobs.length === 0) {
    return (
      <div className="flex">
        <div className="w-80 min-h-screen bg-gray-50 border-r p-6">
          {tAdmin("noJobsFound")}
        </div>
      </div>
    );
  }
  const selectedJob = customJobs[0];
  const questions = selectedJob.custom_job_questions;
  const { questionId } = await searchParams;
  const currentQuestion =
    (questionId &&
      questions.find(
        (q: Tables<"custom_job_questions">) => q.id === questionId
      )) ||
    (questions.length > 0 ? questions[0] : null);
  const currentSubmissions =
    currentQuestion?.custom_job_question_submissions || [];

  return (
    <div className="relative w-full min-h-screen bg-white">
      {/* Header Bar */}
      <div className="sticky top-0 z-30 w-full bg-white border-b flex flex-col md:flex-row items-start md:items-center justify-between px-6 py-4 gap-2 md:gap-0">
        <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
          <div>
            <div className="text-xl font-semibold text-gray-900">{name}</div>
            <div className="text-sm text-gray-500 flex flex-row gap-2 items-center">
              {role && <span>{role}</span>}
              {role && cohort && <span className="mx-1">&bull;</span>}
              {cohort && <span>{tAdmin("cohort", { cohort })}</span>}
            </div>
          </div>
        </div>
        <div className="flex flex-row items-center gap-6 mt-2 md:mt-0">
          <div className="flex items-center gap-1 text-gray-500">
            <div className="flex flex-col gap-2 items-center">
              <div className="flex flex-row items-center gap-1">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="font-medium text-gray-900">
                  {t("started")}
                </span>
              </div>
              <span className="ml-1">{started}</span>
            </div>
          </div>
        </div>
      </div>
      {/* Sidebar and Main Content Row */}
      <div
        className="flex flex-row w-full min-h-0"
        style={{ height: "calc(100vh - 90px)" }}
      >
        {/* Sidebar */}
        <aside className="w-80 border-r flex flex-col overflow-y-auto h-full min-h-0">
          <div className="p-6 border-b">
            {customJobs.length === 1 ? (
              <Card className="w-full bg-white border rounded-lg shadow-sm">
                <div className="px-4 py-3">
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    {selectedJob.job_title}
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-500">
                    {tAdmin("questionsCount", {
                      count: questions?.length || 0,
                    })}
                  </CardDescription>
                </div>
              </Card>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="w-full bg-white border rounded-lg px-4 py-3 flex items-center justify-between shadow-sm hover:bg-gray-50 transition"
                    type="button"
                  >
                    <div className="flex flex-col items-start text-left">
                      <span className="text-lg font-semibold text-gray-900">
                        {selectedJob.job_title}
                      </span>
                      <span className="text-sm text-gray-500">
                        {tAdmin("questionsCount", {
                          count: questions?.length || 0,
                        })}
                      </span>
                    </div>
                    <svg
                      className="w-5 h-5 text-gray-400 ml-2"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-full mt-2">
                  {customJobs.map((job: Tables<"custom_jobs">) => (
                    <Link
                      href={`/dashboard/coach-admin/students/${studentId}/job/${job.id}`}
                    >
                      <DropdownMenuItem
                        key={job.id}
                        className="flex flex-col items-start px-4 py-2"
                      >
                        <span className="text-base font-medium text-gray-900">
                          {job.job_title}
                        </span>
                      </DropdownMenuItem>
                    </Link>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-3">
              {questions?.map((q: any) => {
                const submissions = q.custom_job_question_submissions;
                const completed = !!submissions.length;
                return (
                  <Link
                    key={q.id}
                    href={`/dashboard/coach-admin/students/${studentId}/jobs/${selectedJob.id}?questionId=${q.id}`}
                    className="block"
                  >
                    <li
                      className={`rounded-lg px-4 py-3 flex flex-col gap-1 ${
                        currentQuestion?.id === q.id
                          ? "ring-2 ring-primary border-primary bg-primary/10"
                          : completed
                            ? "bg-green-50 border border-green-200"
                            : "bg-white border"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {q.question}
                        </span>
                        {completed && (
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {tAdmin("lastSubmission", {
                          date:
                            submissions.length > 0
                              ? formatDate(submissions[0].created_at)
                              : tAdmin("dash"),
                        })}
                      </div>
                    </li>
                  </Link>
                );
              })}
            </ul>
          </div>
        </aside>
        {/* Main Content */}
        <div className="flex-1 px-4 md:px-8 py-6 overflow-y-auto h-full min-h-0">
          {currentQuestion && (
            <StudentQuestionSubmissions
              question={currentQuestion}
              submissions={currentSubmissions}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminStudentView;
