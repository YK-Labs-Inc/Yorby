"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tables } from "@/utils/supabase/database.types";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import remarkGfm from "remark-gfm";
import ReactMarkdown from "react-markdown";

export default function AnswerGuideline({
  question,
}: {
  question: Tables<"custom_job_questions">;
}) {
  const t = useTranslations("interviewQuestion");
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card>
      <CardHeader
        className="cursor-pointer flex flex-row items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="text-sm">{t("answerGuidelines")}</CardTitle>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-4 pt-4 max-h-80 overflow-y-auto custom-scrollbar">
          <div className="text-sm text-muted-foreground markdown max-h-64 overflow-y-auto custom-scrollbar">
            <div className="p-4 border rounded-lg bg-muted/30">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {question.answer_guidelines}
              </ReactMarkdown>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
