"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Calendar } from "lucide-react";
import { getProgramMockInterviews } from "@/app/dashboard/coach-admin/actions";
import useSWR from "swr";

interface MockInterview {
  id: string;
  created_at: string;
  duration?: number;
}

interface MockInterviewsListProps {
  programId: string;
  studentId: string;
  locale: string;
  onSelectInterview: (interviewId: string) => void;
}

const formatDate = (dateString: string): string => {
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

const formatDuration = (seconds?: number): string => {
  if (!seconds) return "";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

export default function MockInterviewsList({
  programId,
  studentId,
  locale,
  onSelectInterview,
}: MockInterviewsListProps) {
  const t = useTranslations("StudentActivitySidebar");
  const searchParams = useSearchParams();
  const selectedInterviewId = searchParams.get("item");

  const { data, error, isLoading } = useSWR(
    [`programMockInterviews-${programId}-${studentId}`],
    async () => {
      const data = await getProgramMockInterviews(programId, studentId);
      return data.mockInterviews || [];
    }
  );

  const interviews = data || [];

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (interviews.length === 0 || error) {
    return (
      <div className="p-4">
        <p className="text-sm text-gray-500 p-3">
          {t("noMockInterviewsFound")}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <ul className="space-y-2">
        {interviews.map((interview) => {
          const isActive = selectedInterviewId === interview.id;

          return (
            <li key={interview.id}>
              <button
                onClick={() => onSelectInterview(interview.id)}
                className={`w-full text-left block rounded-md px-3 py-2.5 transition-all
                  ${
                    isActive
                      ? "ring-2 ring-primary border-primary bg-primary/10 shadow-sm"
                      : "bg-white border border-gray-200 hover:bg-gray-50"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-800">
                      {formatDate(interview.created_at)}
                    </div>
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
