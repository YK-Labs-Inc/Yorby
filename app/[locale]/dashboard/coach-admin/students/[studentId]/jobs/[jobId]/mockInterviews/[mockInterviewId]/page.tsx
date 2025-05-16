import { createAdminClient } from "@/utils/supabase/server";
import { Logger } from "next-axiom";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle, Clock } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Tables } from "@/utils/supabase/database.types";
import MockInterviewReview from "@/app/[locale]/dashboard/jobs/[jobId]/mockInterviews/[mockInterviewId]/review/MockInterviewReview";

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
  if (!coachUser) return notFound();
  const { data: coach } = await supabase
    .from("coaches")
    .select("id")
    .eq("user_id", coachUser.id)
    .single();
  if (!coach) return notFound();
  return coach;
};

const fetchCustomJob = async (jobId: string) => {
  const supabase = await createSupabaseServerClient();
  const { data: job, error } = await supabase
    .from("custom_jobs")
    .select("*")
    .eq("id", jobId)
    .single();
  if (error) return null;
  return job;
};

const fetchMockInterviews = async (jobId: string) => {
  const supabase = await createSupabaseServerClient();
  const { data: mockInterviews, error } = await supabase
    .from("custom_job_mock_interviews")
    .select("*")
    .eq("custom_job_id", jobId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("hey error", error);
    return [];
  }
  return mockInterviews;
};

const formatDate = (dateString: string) => {
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
};

type AdminStudentMockInterviewViewProps = {
  params: Promise<{
    studentId: string;
    jobId: string;
    mockInterviewId: string;
  }>;
};

const AdminStudentMockInterviewView = async ({
  params,
}: AdminStudentMockInterviewViewProps) => {
  const t = await getTranslations("AdminStudentHeader");
  const tAdmin = await getTranslations("AdminStudentMockInterviewView");
  const { studentId, jobId, mockInterviewId } = await params;
  const student = await fetchStudent(studentId);
  if (!student) return notFound();
  const user = student.user;
  const name = user.user_metadata?.full_name || user.email || tAdmin("unknown");
  const role = user.user_metadata?.role || "";
  const cohort = user.user_metadata?.cohort || "";
  const started = formatDate(user.created_at);
  const job = await fetchCustomJob(jobId);
  console.log("hey job", job);
  const mockInterviews = await fetchMockInterviews(jobId);
  console.log("hey mockInterviews", mockInterviews);
  if (!mockInterviews || mockInterviews.length === 0) {
    return (
      <div className="flex">
        <div className="w-80 min-h-screen bg-gray-50 border-r p-6">
          {tAdmin("noMockInterviewsFound")}
        </div>
      </div>
    );
  }
  const selectedMockInterview =
    mockInterviews.find((mi) => mi.id === mockInterviewId) || mockInterviews[0];
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
            <Card className="w-full bg-white border rounded-lg shadow-sm">
              <div className="px-4 py-3">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  {job?.job_title || tAdmin("unknownJob")}
                </CardTitle>
                <CardDescription className="text-sm text-gray-500">
                  {tAdmin("mockInterviewCount", {
                    count: mockInterviews.length,
                  })}
                </CardDescription>
              </div>
            </Card>
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-3">
              {mockInterviews.map((mi) => (
                <Link
                  key={mi.id}
                  href={`/dashboard/coach-admin/students/${studentId}/jobs/${jobId}/mockInterviews/${mi.id}`}
                  className="block"
                >
                  <li
                    className={`rounded-lg px-4 py-3 flex flex-col gap-1 border transition-all cursor-pointer ${
                      selectedMockInterview.id === mi.id
                        ? "ring-2 ring-primary border-primary bg-primary/10"
                        : mi.status === "complete"
                          ? "bg-green-50 border-green-200"
                          : "bg-white border"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {tAdmin("mockInterviewDate", {
                          date: formatDate(mi.created_at),
                        })}
                      </span>
                      {mi.status === "complete" ? (
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {tAdmin("mockInterviewStatus", { status: mi.status })}
                    </div>
                  </li>
                </Link>
              ))}
            </ul>
          </div>
        </aside>
        {/* Main Content */}
        <div className="flex-1 px-4 md:px-8 py-6 overflow-y-auto h-full min-h-0">
          <MockInterviewReview mockInterviewId={selectedMockInterview.id} />
        </div>
      </div>
    </div>
  );
};

export default AdminStudentMockInterviewView;
