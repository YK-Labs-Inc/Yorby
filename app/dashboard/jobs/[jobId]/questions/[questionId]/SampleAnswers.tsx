"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tables } from "@/utils/supabase/database.types";
import { useTranslations } from "next-intl";
import remarkGfm from "remark-gfm";
import ReactMarkdown from "react-markdown";
import AudioPlayer from "@/components/ui/audio-player";

interface SampleAnswersProps {
  sampleAnswers: Tables<"custom_job_question_sample_answers">[];
}

export default function SampleAnswers({ sampleAnswers }: SampleAnswersProps) {
  const t = useTranslations("interviewQuestion");

  if (!sampleAnswers || sampleAnswers.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 overflow-y-auto custom-scrollbar">
      {sampleAnswers.map((sampleAnswer, index) => (
        <Card className="max-h-[300px] flex flex-col" key={sampleAnswer.id}>
          <CardHeader className="border-b-2 py-2 mb-2 bg-background">
            <CardTitle className="text-base">
              Sample Answer #{index + 1}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto pt-0">
            {sampleAnswer.bucket && sampleAnswer.file_path && (
              <AudioPlayer
                bucket={sampleAnswer.bucket}
                filePath={sampleAnswer.file_path}
                className="mb-3"
              />
            )}
            <div className="text-sm text-muted-foreground markdown">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {sampleAnswer.answer}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
