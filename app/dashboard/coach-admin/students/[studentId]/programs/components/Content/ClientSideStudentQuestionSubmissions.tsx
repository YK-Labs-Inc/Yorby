"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tables } from "@/utils/supabase/database.types";
import { FileText } from "lucide-react";
import React from "react";
import { useTranslations } from "next-intl";
import QuestionFeedback from "@/components/ui/question-feedback";
import SubmissionVideoPlayer from "@/app/dashboard/jobs/[jobId]/questions/[questionId]/SubmissionVideoPlayer";
import CoachFeedbackSection from "../../../jobs/[jobId]/questions/[questionId]/CoachFeedbackSection";

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }).format(date);
}

interface ClientSideStudentQuestionSubmissionsProps {
  question: Tables<"custom_job_questions">;
  submissions: (Tables<"custom_job_question_submissions"> & {
    custom_job_question_submission_mux_metadata?: Tables<"custom_job_question_submission_mux_metadata"> | null;
  })[];
  currentSubmissionId?: string;
  studentId: string;
  jobId: string;
  questionId: string;
  currentSubmission:
    | (Tables<"custom_job_question_submissions"> & {
        custom_job_question_submission_mux_metadata?: Tables<"custom_job_question_submission_mux_metadata"> | null;
      })
    | null;
  currentCoachFeedback: any;
  onSubmissionChange: (submissionId: string) => void;
  onFeedbackUpdate?: () => void;
}

export default function ClientSideStudentQuestionSubmissions({
  question,
  submissions,
  currentSubmissionId,
  studentId,
  jobId,
  questionId,
  currentSubmission,
  currentCoachFeedback,
  onSubmissionChange,
  onFeedbackUpdate,
}: ClientSideStudentQuestionSubmissionsProps) {
  const t = useTranslations(
    "coachAdminPortal.studentsPage.studentQuestionSubmissions"
  );

  // Feedback structure: { pros: string[], cons: string[], correctness_score?: number }
  const feedback = currentSubmission?.feedback as {
    pros: string[];
    cons: string[];
    correctness_score?: number;
  } | null;

  return (
    <div className="flex flex-col gap-6">
      {/* Question */}
      <Card>
        <CardHeader>
          <CardTitle>{t("question")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-medium text-gray-900 mb-2">
            {question.question}
          </p>
        </CardContent>
      </Card>

      {/* Current Submission or Empty State */}
      {currentSubmission ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{t("submissionDetails")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {t("submitted", {
                      date: formatDate(currentSubmission.created_at),
                    })}
                  </span>
                </div>
                <div className="flex gap-2">
                  <p className="flex-1 whitespace-pre-line text-gray-800 border rounded p-3 bg-gray-50">
                    {currentSubmission.answer}
                  </p>
                  <SubmissionVideoPlayer
                    currentSubmission={currentSubmission}
                  />
                </div>

                <Separator />
                {/* Pros/Cons using InterviewFeedback component */}
                {feedback &&
                (feedback.pros.length > 0 || feedback.cons.length > 0) ? (
                  <QuestionFeedback
                    feedback={feedback}
                    className="mt-4"
                    correctnessScore={feedback.correctness_score}
                  />
                ) : (
                  <p className="italic text-gray-500">{t("greatAnswer")}</p>
                )}
                {/* Coach Feedback Section for the current active submission */}
                <CoachFeedbackSection
                  submissionId={currentSubmission.id}
                  existingFeedback={currentCoachFeedback}
                  onFeedbackUpdate={onFeedbackUpdate}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submission History */}
          <Card>
            <CardHeader>
              <CardTitle>{t("submissionHistory")}</CardTitle>
            </CardHeader>
            <CardContent>
              {submissions.length === 0 ? (
                <p className="italic text-gray-500">
                  {t("noPreviousSubmissions")}
                </p>
              ) : (
                <ul className="space-y-4">
                  {submissions.map((submission) => {
                    const feedback = submission.feedback as {
                      pros: string[];
                      cons: string[];
                      correctness_score?: number;
                    } | null;
                    return (
                      <li
                        key={submission.id}
                        className={`border rounded-lg p-3 bg-white cursor-pointer transition-colors ${
                          submission.id === currentSubmission.id
                            ? "ring-2 ring-primary border-primary bg-primary/10"
                            : "hover:bg-gray-50"
                        }`}
                        onClick={() => onSubmissionChange(submission.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-gray-500">
                                {t("submitted", {
                                  date: formatDate(submission.created_at),
                                })}
                              </span>
                            </div>
                            <p className="text-gray-800 line-clamp-3">
                              {submission.answer}
                            </p>
                          </div>
                          {feedback &&
                            typeof feedback.correctness_score === "number" && (
                              <span
                                className={`ml-2 flex items-center justify-center rounded-lg text-white font-bold shadow-md p-1
                            ${
                              feedback.correctness_score >= 80
                                ? "bg-green-500"
                                : feedback.correctness_score >= 50
                                  ? "bg-yellow-400 text-yellow-900"
                                  : "bg-red-500"
                            }
                          `}
                              >
                                {feedback.correctness_score}%
                              </span>
                            )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-gray-100 p-3 mb-4">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t("noSubmissions")}
            </h3>
            <p className="text-gray-500 max-w-md">
              {t("noSubmissionsDescription")}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
