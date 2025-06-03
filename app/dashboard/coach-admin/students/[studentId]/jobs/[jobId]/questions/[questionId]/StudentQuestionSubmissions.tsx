"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tables } from "@/utils/supabase/database.types";
import Link from "next/link";
import { CoachFeedbackForm } from "./CoachFeedbackForm";
import { Button } from "@/components/ui/button";
import { Pencil, Sparkles, Trash2, FileText } from "lucide-react";
import React, { useState } from "react";
import { useTranslations } from "next-intl";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { deleteCoachFeedback } from "./actions";
import AudioPlayer from "@/components/ui/audio-player";
import QuestionFeedback from "@/components/ui/question-feedback";

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

function CoachFeedbackCard({
  feedback,
  onEdit,
  onDelete,
}: {
  feedback: any;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations(
    "coachAdminPortal.studentsPage.studentQuestionSubmissions"
  );
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  return (
    <Card className="mt-8 border-4 border-yellow-400 bg-yellow-50/80 shadow-xl relative overflow-visible">
      <div className="absolute -top-5 left-6 flex items-center gap-2 z-10">
        <div
          className="flex items-center bg-yellow-300 text-yellow-900 font-bold px-3 py-1 rounded-full shadow border-2 border-yellow-400 text-sm"
          title={t("coachFeedback")}
          aria-label={t("coachFeedback")}
        >
          <Sparkles
            className="w-4 h-4 mr-1 text-yellow-700"
            fill="currentColor"
          />
          {t("coachFeedback")}
        </div>
      </div>
      <CardHeader className="flex flex-row items-center justify-end pt-8 pb-2">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            title={t("editFeedback")}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                title={t("deleteDialogTitle")}
                onClick={() => setOpen(true)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("deleteDialogTitle")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("deleteDialogDescription")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              {error && (
                <div className="text-destructive text-sm mb-2">{error}</div>
              )}
              <AlertDialogFooter>
                <AlertDialogCancel disabled={loading}>
                  {t("deleteDialogCancel")}
                </AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-white hover:bg-destructive/90"
                  disabled={loading}
                  onClick={async () => {
                    setLoading(true);
                    setError(null);
                    const formData = new FormData();
                    formData.append("feedbackId", feedback.id);
                    const res = await deleteCoachFeedback(formData);
                    setLoading(false);
                    if (res?.error) {
                      setError(t("deleteDialogError"));
                    } else {
                      setOpen(false);
                      if (onDelete) onDelete();
                    }
                  }}
                >
                  {t("deleteDialogConfirm")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-lg bg-white/80 dark:bg-yellow-100/10 p-6 overflow-y-auto border border-yellow-200 max-h-[400px] relative shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles
                className="w-5 h-5 text-yellow-500"
                fill="currentColor"
              />
              <h3 className="font-semibold text-lg text-yellow-900">
                {t("strengths")}
              </h3>
            </div>
            <div className="space-y-3">
              {feedback.pros.length === 0 ? (
                <p className="text-yellow-800 italic">{t("noStrengths")}</p>
              ) : (
                feedback.pros.map((pro: string, idx: number) => (
                  <div key={idx} className="flex gap-2 items-start">
                    <span className="text-yellow-600 mt-1">•</span>
                    <p className="text-yellow-900">{pro}</p>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="rounded-lg bg-white/80 dark:bg-yellow-100/10 p-6 overflow-y-auto border border-yellow-200 max-h-[400px] relative shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles
                className="w-5 h-5 text-yellow-500"
                fill="currentColor"
              />
              <h3 className="font-semibold text-lg text-yellow-900">
                {t("areasForImprovement")}
              </h3>
            </div>
            <div className="space-y-3">
              {feedback.cons.length === 0 ? (
                <p className="text-yellow-800 italic">
                  {t("noAreasForImprovement")}
                </p>
              ) : (
                feedback.cons.map((con: string, idx: number) => (
                  <div key={idx} className="flex gap-2 items-start">
                    <span className="text-yellow-600 mt-1">•</span>
                    <p className="text-yellow-900">{con}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CoachFeedbackSection({
  submissionId,
  existingFeedback,
}: {
  submissionId: string;
  existingFeedback: any;
}) {
  const [editing, setEditing] = React.useState(false);
  const [deleted, setDeleted] = React.useState(false);
  const t = useTranslations(
    "coachAdminPortal.studentsPage.studentQuestionSubmissions"
  );
  if (deleted) return null;
  return (
    <div className="mt-8">
      {editing ? (
        <CoachFeedbackForm
          submissionId={submissionId}
          existingFeedback={existingFeedback}
          onComplete={() => setEditing(false)}
          onCancel={() => setEditing(false)}
        />
      ) : existingFeedback ? (
        <CoachFeedbackCard
          feedback={existingFeedback}
          onEdit={() => setEditing(true)}
          onDelete={() => setDeleted(true)}
        />
      ) : (
        <Button onClick={() => setEditing(true)}>{t("addFeedback")}</Button>
      )}
    </div>
  );
}

interface StudentQuestionSubmissionsProps {
  question: Tables<"custom_job_questions">;
  submissions: Tables<"custom_job_question_submissions">[];
  currentSubmissionId?: string;
  studentId: string;
  jobId: string;
  questionId: string;
  currentSubmission: Tables<"custom_job_question_submissions"> | null;
  currentCoachFeedback: any;
}

export default function StudentQuestionSubmissions({
  question,
  submissions,
  currentSubmissionId,
  studentId,
  jobId,
  questionId,
  currentSubmission,
  currentCoachFeedback,
}: StudentQuestionSubmissionsProps) {
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
                <p className="whitespace-pre-line text-gray-800 border rounded p-3 bg-gray-50">
                  {currentSubmission.answer}
                </p>

                {/* Audio Player */}
                {currentSubmission.audio_bucket &&
                  currentSubmission.audio_file_path && (
                    <AudioPlayer
                      bucket={currentSubmission.audio_bucket}
                      filePath={currentSubmission.audio_file_path}
                      presetDuration={
                        currentSubmission.audio_recording_duration || undefined
                      }
                    />
                  )}

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
                      >
                        <Link
                          href={`/dashboard/coach-admin/students/${studentId}/jobs/${jobId}/questions/${questionId}?submissionId=${submission.id}`}
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
                              typeof feedback.correctness_score ===
                                "number" && (
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
                        </Link>
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
