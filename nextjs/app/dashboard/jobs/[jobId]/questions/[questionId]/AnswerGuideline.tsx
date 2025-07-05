"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tables } from "@/utils/supabase/database.types";
import { useTranslations } from "next-intl";
import remarkGfm from "remark-gfm";
import ReactMarkdown from "react-markdown";

export default function AnswerGuideline({
  question,
}: {
  question: Tables<"custom_job_questions">;
}) {
  const t = useTranslations("interviewQuestion");

  return (
    <div className="markdown p-4">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {question.answer_guidelines}
      </ReactMarkdown>
    </div>
  );
}
