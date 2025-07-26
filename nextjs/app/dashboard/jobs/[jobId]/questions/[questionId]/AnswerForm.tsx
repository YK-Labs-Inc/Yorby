"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { Tables } from "@/utils/supabase/database.types";
import AnswerGuideline from "./AnswerGuideline";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import SampleAnswers from "./SampleAnswers";
import QuestionFeedbackTab from "./QuestionFeedbackTab";
import { useMultiTenant } from "@/app/context/MultiTenantContext";
import AnswerInputSection from "./AnswerInputSection";
import AnswerSubmission from "./AnswerSubmission";

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

export default function AnswerForm({
  question,
  jobId,
  submissions,
  currentSubmission,
  sampleAnswers,
  coachUserId,
}: {
  question: Tables<"custom_job_questions">;
  jobId: string;
  submissions: (Tables<"custom_job_question_submissions"> & {
    custom_job_question_submission_feedback: Tables<"custom_job_question_submission_feedback">[];
    mux_metadata?: Tables<"custom_job_question_submission_mux_metadata"> | null;
  })[];
  currentSubmission:
    | (Tables<"custom_job_question_submissions"> & {
        custom_job_question_submission_feedback: Tables<"custom_job_question_submission_feedback">[];
        mux_metadata?: Tables<"custom_job_question_submission_mux_metadata"> | null;
      })
    | null;
  sampleAnswers: Tables<"custom_job_question_sample_answers">[];
  coachUserId: string | null;
}) {
  const t = useTranslations("interviewQuestion");
  const { isPerfectInterview } = useMultiTenant();

  const [activeTab, setActiveTab] = useState<
    "question" | "guidelines" | "samples" | "submissions" | "feedback"
  >("question");

  const [isCreatingNewSubmission, setIsCreatingNewSubmission] = useState(false);

  useEffect(() => {
    const getFeedback = () => {
      // Get feedback from either source (moved up to determine default tab)
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
      return feedback || manualFeedback;
    };
    const containsFeedback = getFeedback();
    const newDefaultTab = containsFeedback ? "feedback" : "question";
    setActiveTab(newDefaultTab);

    // Reset creating new submission state when current submission changes
    setIsCreatingNewSubmission(false);
  }, [currentSubmission?.id]);

  const { baseUrl } = useMultiTenant();

  return (
    <div className="flex flex-col gap-4">
      {/* Main split layout */}
      <div className="flex gap-4 h-[calc(100vh-60px)]">
        {/* Left Side - Tabbed Content */}
        <Card className="w-1/2 flex flex-col flex-1">
          {/* Tab Navigation */}
          <CardContent className="p-0 flex-shrink-0">
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab("question")}
                className={`flex-1 px-4 py-3 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === "question"
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                📋 {t("questionLabel")}
              </button>
              <button
                onClick={() => setActiveTab("guidelines")}
                className={`flex-1 px-4 py-3 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === "guidelines"
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                📖 Guidelines
              </button>
              {isPerfectInterview && (
                <button
                  onClick={() => setActiveTab("samples")}
                  className={`flex-1 px-4 py-3 text-xs font-medium border-b-2 transition-colors ${
                    activeTab === "samples"
                      ? "border-primary text-primary bg-primary/5"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  🧪 Samples
                </button>
              )}
              <button
                onClick={() => setActiveTab("submissions")}
                className={`flex-1 px-4 py-3 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === "submissions"
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                🔄 {t("submissionsLabel")}
              </button>
              <button
                onClick={() => setActiveTab("feedback")}
                className={`flex-1 px-4 py-3 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === "feedback"
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                💬 {t("feedbackLabel")}
              </button>
            </div>
          </CardContent>

          {/* Tab Content */}
          <CardContent className="flex-1 overflow-y-auto p-2">
            {activeTab === "question" && (
              <div className="h-full">
                <h3 className="font-semibold text-lg mb-4">
                  {t("questionLabel")}
                </h3>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {question.question}
                </p>
              </div>
            )}

            {activeTab === "guidelines" && (
              <div className="h-full">
                <AnswerGuideline question={question} />
              </div>
            )}

            {activeTab === "samples" && (
              <div className="h-full">
                <SampleAnswers sampleAnswers={sampleAnswers} />
              </div>
            )}

            {activeTab === "submissions" && (
              <div className="h-full">
                <h3 className="font-semibold text-lg mb-4">
                  {t("submissionsLabel")}
                </h3>
                <div className="space-y-4">
                  {submissions.length === 0 ? (
                    <p className="text-muted-foreground italic">
                      {t("noSubmissions")}
                    </p>
                  ) : (
                    submissions.map((submission) => {
                      const hasAdminFeedback =
                        submission.custom_job_question_submission_feedback.some(
                          (feedback) => feedback.feedback_role === "user"
                        );
                      return (
                        <Link
                          key={submission.id}
                          href={`${baseUrl}/${jobId}/questions/${question.id}?submissionId=${submission.id}`}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors w-full text-left"
                        >
                          <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                              <p className="text-sm text-muted-foreground">
                                {t("submissionDate", {
                                  date: formatDate(
                                    new Date(submission.created_at)
                                  ),
                                })}
                              </p>
                            </div>
                            <p className="text-sm">{submission.answer}</p>
                          </div>
                          {hasAdminFeedback && (
                            <Sparkles
                              className="h-4 w-4 text-yellow-500"
                              fill="currentColor"
                            />
                          )}
                        </Link>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {activeTab === "feedback" && (
              <div className="h-full">
                <QuestionFeedbackTab currentSubmission={currentSubmission} />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="w-1/2 flex flex-col gap-4 flex-1">
          {/* Right Side - Answer Submission View or Input Section */}
          {currentSubmission && !isCreatingNewSubmission ? (
            <AnswerSubmission
              currentSubmission={currentSubmission}
              onCreateNewSubmission={() => setIsCreatingNewSubmission(true)}
            />
          ) : (
            <AnswerInputSection
              question={question}
              jobId={jobId}
              currentSubmission={null}
              coachUserId={coachUserId}
            />
          )}
        </div>
      </div>
    </div>
  );
}
