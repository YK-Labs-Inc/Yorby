"use client";

import { useSearchParams } from "next/navigation";
import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { getProgramQuestions } from "@/app/dashboard/coach-admin/actions";
import useSWR from "swr";

interface Question {
  id: string;
  question: string;
  created_at: string;
  hasSubmission: boolean;
  hasCoachFeedback: boolean;
  latestSubmission?: {
    created_at: string;
  };
}

interface QuestionsListProps {
  programId: string;
  studentId: string;
  locale: string;
  onSelectQuestion: (questionId: string) => void;
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

export default function QuestionsList({
  programId,
  studentId,
  locale,
  onSelectQuestion,
}: QuestionsListProps) {
  const t = useTranslations("StudentActivitySidebar");
  const searchParams = useSearchParams();
  const selectedQuestionId = searchParams.get("item");

  const { data, error, isLoading } = useSWR(
    [`programQuestions-${programId}-${studentId}`],
    async () => {
      const data = await getProgramQuestions(programId, studentId);

      if (data.questions) {
        // Sort questions: ones with submissions first
        const sortedQuestions = [...data.questions].sort((a, b) => {
          // If both have submissions or both don't, maintain original order
          if (a.hasSubmission === b.hasSubmission) {
            return 0;
          }
          // Questions with submissions come first
          return a.hasSubmission ? -1 : 1;
        });
        return sortedQuestions;
      }
      return [];
    }
  );

  const questions = data || [];

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (questions.length === 0 || error) {
    return (
      <div className="p-4">
        <p className="text-sm text-gray-500 p-3">
          {t("noQuestionsFoundForJob")}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <ul className="space-y-2">
        {questions.map((question) => {
          const isActive = selectedQuestionId === question.id;
          const hasSubmission = question.hasSubmission;

          return (
            <li key={question.id}>
              <button
                onClick={() => onSelectQuestion(question.id)}
                className={`w-full text-left block rounded-md px-3 py-2.5 transition-all
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
                          ? formatDate(question.latestSubmission?.created_at)
                          : t("dash"),
                      })}
                    </div>
                  </div>
                  {question.hasCoachFeedback && (
                    <Sparkles className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0 ml-2" />
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
