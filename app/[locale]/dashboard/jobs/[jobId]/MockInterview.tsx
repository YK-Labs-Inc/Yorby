"use server";

import { createSupabaseServerClient } from "@/utils/supabase/server";
import { formatDate } from "@/utils/utils";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import CreateMockInterviewButton from "./CreateMockInterviewButton";
import { CheckCircle, Clock } from "lucide-react";
import InterviewFilter from "./InterviewFilter";
import LockedJobComponent from "./LockedJobComponent";

interface MockInterviewProps {
  filter: "all" | "complete" | "in_progress" | null;
  jobId: string;
  userCredits: number;
  isLocked: boolean;
}

async function fetchMockInterviews(jobId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: mockInterviews, error } = await supabase
    .from("custom_job_mock_interviews")
    .select("*")
    .eq("custom_job_id", jobId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return mockInterviews;
}

export default async function MockInterview({
  filter,
  jobId,
  userCredits,
  isLocked,
}: MockInterviewProps) {
  const t = await getTranslations("mockInterview");
  const allMockInterviews = await fetchMockInterviews(jobId);

  const filteredInterviews = allMockInterviews.filter((interview) => {
    if (filter === "complete") return interview.status === "complete";
    if (filter === "in_progress") return interview.status !== "complete";
    return true;
  });

  if (isLocked) {
    return <LockedJobComponent jobId={jobId} userCredits={userCredits} />;
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-semibold">{t("title")}</h2>
          <InterviewFilter jobId={jobId} currentFilter={filter} />
        </div>
        <CreateMockInterviewButton jobId={jobId} />
      </div>

      {allMockInterviews.length === 0 ? (
        <div className="flex items-center justify-center p-8 text-gray-500 bg-gray-50 dark:bg-gray-800/20 rounded-lg">
          {t("noInterviews")}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredInterviews.map((interview) => (
            <Link
              key={interview.id}
              href={
                interview.status === "complete"
                  ? `/dashboard/jobs/${jobId}/mockInterviews/${interview.id}/review`
                  : `/dashboard/jobs/${jobId}/mockInterviews/${interview.id}`
              }
              className="group flex items-center justify-between p-6 bg-white dark:bg-gray-800/10 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors border border-gray-100 dark:border-gray-800 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`p-2 rounded-lg ${
                    interview.status === "complete"
                      ? "bg-green-50 dark:bg-green-900/20"
                      : "bg-amber-50 dark:bg-amber-900/20"
                  }`}
                >
                  {interview.status === "complete" ? (
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  )}
                </div>
                <span className="text-base font-medium text-gray-900 dark:text-gray-100">
                  {t("interviewDate", {
                    date: formatDate(new Date(interview.created_at)),
                  })}
                </span>
              </div>
              <svg
                className="w-4 h-4 text-gray-600 dark:text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
