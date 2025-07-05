"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Tables } from "@/utils/supabase/database.types";

interface MockInterviewItemProps {
  mockInterview: Tables<"custom_job_mock_interviews">;
  studentId: string;
  jobId: string;
  locale: string;
}

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "-";
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

const configureStatus = (
  status: string | null,
  t: (key: string, params?: any) => string
): string => {
  if (status === null) return t("unknown");
  switch (status) {
    case "complete":
      return t("complete");
    case "in_progress":
      return t("inProgress");
    default:
      return t("unknown");
  }
};

export default function MockInterviewItem({
  mockInterview,
  studentId,
  jobId,
  locale,
}: MockInterviewItemProps) {
  const t = useTranslations("StudentActivitySidebar");
  const params = useParams();
  const currentMockInterviewId = params?.mockInterviewId as string;
  const isActive = currentMockInterviewId === mockInterview.id;

  return (
    <li>
      <Link
        href={`/dashboard/coach-admin/students/${studentId}/jobs/${jobId}/mockInterviews/${mockInterview.id}`}
        locale={locale}
        className={`block rounded-md px-3 py-2.5 border transition-all cursor-pointer
          ${
            isActive
              ? "ring-2 ring-primary border-primary bg-primary/10 shadow-sm"
              : mockInterview.status === "complete"
              ? "bg-green-50 border-green-200 hover:bg-green-100"
              : "bg-white border-gray-200 hover:bg-gray-50"
          }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-gray-800">
            {t("mockInterviewDate", {
              date: formatDate(mockInterview.created_at),
            })}
          </span>
        </div>
        <div className="text-xs text-gray-500 mt-0.5">
          {t("mockInterviewStatus", {
            status: configureStatus(mockInterview.status, t),
          })}
        </div>
      </Link>
    </li>
  );
}