"use client";

import { useTranslations } from "next-intl";
import { FileQuestion, Video } from "lucide-react";

interface EmptyStateProps {
  tab: "questions" | "interviews";
  locale: string;
}

export default function EmptyState({ tab, locale }: EmptyStateProps) {
  const t = useTranslations("AdminStudentView");
  
  const icon = tab === "questions" ? (
    <FileQuestion className="w-16 h-16 text-gray-400 mx-auto mb-4" />
  ) : (
    <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
  );
  
  const message = tab === "questions" 
    ? t("selectQuestionToView")
    : t("selectMockInterviewToView");
  
  return (
    <div className="flex flex-col items-center justify-center h-full">
      {icon}
      <p className="text-gray-600 text-lg text-center">
        {message}
      </p>
    </div>
  );
}