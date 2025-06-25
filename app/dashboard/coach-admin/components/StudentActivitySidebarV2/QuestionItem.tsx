"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { Tables } from "@/utils/supabase/database.types";

interface QuestionItemProps {
  question: Tables<"custom_job_questions">;
  latestSubmission?: Tables<"custom_job_question_submissions"> & {
    hasCoachFeedback?: boolean;
  };
  hasCoachFeedback: boolean;
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

export default function QuestionItem({
  question,
  latestSubmission,
  hasCoachFeedback,
  studentId,
  jobId,
  locale,
}: QuestionItemProps) {
  const t = useTranslations("StudentActivitySidebar");
  const params = useParams();
  const currentQuestionId = params?.questionId as string;
  const isActive = currentQuestionId === question.id;
  const hasSubmission = !!latestSubmission;

  return (
    <li>
      <Link
        href={`/dashboard/coach-admin/students/${studentId}/jobs/${jobId}/questions/${question.id}`}
        locale={locale}
        className={`block rounded-md px-3 py-2.5 transition-all
          ${
            isActive
              ? "ring-2 ring-primary border-primary bg-primary/10 shadow-sm"
              : hasSubmission
              ? "bg-green-50 border border-green-200 hover:bg-green-100"
              : "bg-white border border-gray-200 hover:bg-gray-50"
          }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-800 whitespace-normal break-words">
              {question.question}
            </span>
            <div className="text-xs text-gray-500">
              {t("lastSubmission", {
                date: hasSubmission
                  ? formatDate(latestSubmission.created_at)
                  : t("dash"),
              })}
            </div>
          </div>
          {hasCoachFeedback && (
            <Sparkles className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0 ml-2" />
          )}
        </div>
      </Link>
    </li>
  );
}