"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tables } from "@/utils/supabase/database.types";
import Link from "next/link";
import { CoachFeedbackForm } from "./CoachFeedbackForm";
import { Button } from "@/components/ui/button";
import { Pencil, Sparkles, Trash2, Play, Pause, Volume2 } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
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
import { createSupabaseBrowserClient } from "@/utils/supabase/client";

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

function AudioPlayer({
  submission,
}: {
  submission: Tables<"custom_job_question_submissions">;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Use the duration from the submission data instead of detecting it
  const duration = submission.audio_recording_duration || 0;

  useEffect(() => {
    const getAudioUrl = async () => {
      try {
        setLoading(true);
        setError(null);
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase.storage
          .from(submission.audio_bucket!)
          .createSignedUrl(submission.audio_file_path!, 3600); // 1 hour expiry

        if (error) {
          setError("Failed to load audio");
          return;
        }

        setAudioUrl(data.signedUrl);
      } catch (err) {
        setError("Failed to load audio");
      } finally {
        setLoading(false);
      }
    };

    getAudioUrl();
  }, [submission.audio_bucket, submission.audio_file_path]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => setIsPlaying(false);
    const handleError = () => {
      setError("Failed to load audio");
      setIsPlaying(false);
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, [audioUrl]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const seekTime = (parseFloat(e.target.value) / 100) * duration;
    audio.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) {
      return "0:00";
    }
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (!submission.audio_bucket || !submission.audio_file_path) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
        <Volume2 className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-600">Loading audio...</span>
      </div>
    );
  }

  if (error || !audioUrl) {
    return (
      <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
        <Volume2 className="h-4 w-4 text-red-400" />
        <span className="text-sm text-red-600">Failed to load audio</span>
      </div>
    );
  }

  return (
    <div className="p-3 bg-muted/30 border border-border/50 rounded-md">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={togglePlayPause}
          className="h-8 w-8 p-0 hover:bg-muted"
        >
          {isPlaying ? (
            <Pause className="h-3 w-3" />
          ) : (
            <Play className="h-3 w-3" />
          )}
        </Button>

        <div className="flex-1">
          <input
            type="range"
            min="0"
            max="100"
            value={duration > 0 ? (currentTime / duration) * 100 : 0}
            onChange={handleSeek}
            className="w-full h-1 bg-border rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-foreground [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-none"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>/</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {audioUrl && <audio ref={audioRef} src={audioUrl} preload="metadata" />}
    </div>
  );
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
  if (!currentSubmission) {
    return <div className="text-red-500">{t("submissionNotFound")}</div>;
  }

  // Feedback structure: { pros: string[], cons: string[] }
  const feedback = currentSubmission?.feedback as {
    pros: string[];
    cons: string[];
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

      {/* Current Submission */}
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
            <AudioPlayer submission={currentSubmission} />

            <Separator />
            <Card className="mt-8">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <span>{t("aiFeedback")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {feedback &&
                (feedback.pros.length > 0 || feedback.cons.length > 0) ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="font-medium text-green-800 mb-2">
                        {t("pros")}
                      </h4>
                      {feedback.pros.length === 0 ? (
                        <p className="italic text-green-700">{t("noPros")}</p>
                      ) : (
                        <ul className="list-disc ml-5 space-y-1">
                          {feedback.pros.map((pro, idx) => (
                            <li key={idx} className="text-green-800">
                              {pro}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="font-medium text-red-800 mb-2">
                        {t("cons")}
                      </h4>
                      {feedback.cons.length === 0 ? (
                        <p className="italic text-red-700">{t("noCons")}</p>
                      ) : (
                        <ul className="list-disc ml-5 space-y-1">
                          {feedback.cons.map((con, idx) => (
                            <li key={idx} className="text-red-800">
                              {con}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="italic text-gray-500">{t("greatAnswer")}</p>
                )}
              </CardContent>
            </Card>
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
            <p className="italic text-gray-500">{t("noPreviousSubmissions")}</p>
          ) : (
            <ul className="space-y-4">
              {submissions.map((submission) => (
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
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
