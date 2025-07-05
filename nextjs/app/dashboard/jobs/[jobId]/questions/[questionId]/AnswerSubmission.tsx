"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { Tables } from "@/utils/supabase/database.types";
import { Plus } from "lucide-react";
import SubmissionVideoPlayer from "./SubmissionVideoPlayer";

interface AnswerSubmissionProps {
  currentSubmission: Tables<"custom_job_question_submissions"> & {
    custom_job_question_submission_feedback: Tables<"custom_job_question_submission_feedback">[];
    mux_metadata?: Tables<"custom_job_question_submission_mux_metadata"> | null;
  };
  onCreateNewSubmission: () => void;
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }).format(date);
};

export default function AnswerSubmission({
  currentSubmission,
  onCreateNewSubmission,
}: AnswerSubmissionProps) {
  const t = useTranslations("interviewQuestion");

  const hasAudioOrVideo =
    currentSubmission.audio_bucket && currentSubmission.audio_file_path;

  return (
    <div className="flex flex-col gap-4 flex-1">
      {/* Submission View Card */}
      <Card className="flex-1">
        <CardHeader>
          <Button onClick={onCreateNewSubmission} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            {t("buttons.createNewSubmission")}
          </Button>
        </CardHeader>

        <CardContent>
          {/* Show video/audio player if available */}
          {hasAudioOrVideo && (
            <div className="mb-4">
              <SubmissionVideoPlayer currentSubmission={currentSubmission} />
            </div>
          )}

          {/* Show transcript/answer text */}
          <div>
            <h4 className="font-medium mb-2">
              {hasAudioOrVideo ? "Transcript" : "Answer"}
            </h4>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {currentSubmission.answer}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
