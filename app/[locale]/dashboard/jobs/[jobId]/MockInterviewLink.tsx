"use client";

import { Link } from "@/i18n/routing";
import { Tables } from "@/utils/supabase/database.types";
import { formatDate } from "@/utils/utils";
import { CheckCircle, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
const MockInterviewLink = ({
  interview,
  jobId,
}: {
  interview: Tables<"custom_job_mock_interviews">;
  jobId: string;
}) => {
  const t = useTranslations("mockInterview");
  const params = useParams();
  let mockInterviewsPath = "";
  console.log(params);
  if (params && "coachSlug" in params) {
    mockInterviewsPath = `/coaches/${params.coachSlug}/curriculum/${jobId}/mockInterviews`;
  } else {
    mockInterviewsPath = `/dashboard/jobs/${jobId}/mockInterviews`;
  }
  return (
    <Link
      key={interview.id}
      href={
        interview.status === "complete"
          ? `${mockInterviewsPath}/${interview.id}/review`
          : `${mockInterviewsPath}/${interview.id}`
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
  );
};

export default MockInterviewLink;
