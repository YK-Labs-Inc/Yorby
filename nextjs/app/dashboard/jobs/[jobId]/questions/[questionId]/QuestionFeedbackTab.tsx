"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tables } from "@/utils/supabase/database.types";
import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";
import QuestionFeedback from "@/components/ui/question-feedback";

interface QuestionFeedbackTabProps {
  currentSubmission:
    | (Tables<"custom_job_question_submissions"> & {
        custom_job_question_submission_feedback: Tables<"custom_job_question_submission_feedback">[];
        mux_metadata?: Tables<"custom_job_question_submission_mux_metadata"> | null;
      })
    | null;
}

export default function QuestionFeedbackTab({
  currentSubmission,
}: QuestionFeedbackTabProps) {
  const t = useTranslations("interviewQuestion");

  // Get feedback from either source
  const feedbackFromNewTable =
    currentSubmission?.custom_job_question_submission_feedback?.[0];
  const feedbackFromLegacy = currentSubmission?.feedback as {
    pros: string[];
    cons: string[];
  } | null;

  const feedback = feedbackFromNewTable
    ? {
        pros: feedbackFromNewTable.pros,
        cons: feedbackFromNewTable.cons,
      }
    : feedbackFromLegacy;

  const manualFeedback =
    currentSubmission?.custom_job_question_submission_feedback?.find(
      (feedback) => feedback.feedback_role === "user"
    );

  // If no feedback at all, show empty state
  if (!feedback && !manualFeedback) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-12">
        <h3 className="text-lg font-semibold text-muted-foreground mb-2">
          {t("noFeedbackYet.title")}
        </h3>
        <p className="text-sm text-muted-foreground max-w-md">
          {t("noFeedbackYet.description")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 overflow-y-auto py-6 pb-2">
      {/* Manual Feedback */}
      {manualFeedback && (
        <Card className="py-2 border-4 border-yellow-400 bg-yellow-50/80 shadow-xl relative overflow-visible">
          <div className="absolute -top-5 left-6 flex items-center gap-2 z-10">
            <div
              className="flex items-center bg-yellow-300 text-yellow-900 font-bold px-3 py-1 rounded-full shadow border-2 border-yellow-400 text-sm"
              title={t("manualFeedbackTooltip")}
              aria-label={t("manualFeedbackTooltip")}
            >
              <Sparkles
                className="w-4 h-4 mr-1 text-yellow-700"
                fill="currentColor"
              />
              {t("manualFeedback")}
            </div>
          </div>
          <CardHeader className="pt-8 pb-2">
            <p className="text-yellow-800 text-sm mt-1 font-medium">
              {t("manualFeedbackTooltip")}
            </p>
          </CardHeader>
          <CardContent>
            {manualFeedback.pros.length === 0 &&
            manualFeedback.cons.length === 0 ? (
              <p>{t("noFeedback")}</p>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                <div className="rounded-lg bg-white/80 dark:bg-yellow-100/10 p-4 overflow-y-auto border border-yellow-200 max-h-[200px] relative shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles
                      className="w-4 h-4 text-yellow-500"
                      fill="currentColor"
                    />
                    <h3 className="font-semibold text-yellow-900">
                      {t("pros")}
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {manualFeedback.pros.length === 0 ? (
                      <p className="text-yellow-800 italic text-sm">
                        {t("noPros")}
                      </p>
                    ) : (
                      manualFeedback.pros.map((pro: string, index: number) => (
                        <div key={index} className="flex gap-2 items-start">
                          <span className="text-yellow-600 mt-1 text-sm">
                            •
                          </span>
                          <p className="text-yellow-900 text-sm">{pro}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="rounded-lg bg-white/80 dark:bg-yellow-100/10 p-4 overflow-y-auto border border-yellow-200 max-h-[200px] relative shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles
                      className="w-4 h-4 text-yellow-500"
                      fill="currentColor"
                    />
                    <h3 className="font-semibold text-yellow-900">
                      {t("areasToImprove")}
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {manualFeedback.cons.length === 0 ? (
                      <p className="text-yellow-800 italic text-sm">
                        {t("noAreasToImprove")}
                      </p>
                    ) : (
                      manualFeedback.cons.map((con: string, index: number) => (
                        <div key={index} className="flex gap-2 items-start">
                          <span className="text-yellow-600 mt-1 text-sm">
                            •
                          </span>
                          <p className="text-yellow-900 text-sm">{con}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* AI Feedback */}
      {feedback && <QuestionFeedback feedback={feedback} />}
    </div>
  );
}
