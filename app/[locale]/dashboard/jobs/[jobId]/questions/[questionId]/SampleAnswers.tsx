"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tables } from "@/utils/supabase/database.types";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface SampleAnswersProps {
  sampleAnswers: Tables<"custom_job_question_sample_answers">[];
}

export default function SampleAnswers({ sampleAnswers }: SampleAnswersProps) {
  const t = useTranslations("interviewQuestion");
  const [isExpanded, setIsExpanded] = useState(false);

  if (!sampleAnswers || sampleAnswers.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader
        className="cursor-pointer flex flex-row items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="text-sm">{t("sampleAnswersLabel")}</CardTitle>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-4 pt-4">
          {sampleAnswers.map((sampleAnswer) => (
            <div
              key={sampleAnswer.id}
              className="p-4 border rounded-lg bg-muted/30"
            >
              <p className="text-sm text-muted-foreground">
                {sampleAnswer.answer}
              </p>
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
}
