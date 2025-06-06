"use client";

import { SubmitButton } from "@/components/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";
import { Tables } from "@/utils/supabase/database.types";
import { useActionState, useRef, useTransition } from "react";
import { submitAnswer, generateAnswer } from "./actions";
import { useSearchParams } from "next/navigation";
import { AIButton } from "@/components/ai-button";
import AnswerGuideline from "./AnswerGuideline";
import Link from "next/link";
import { FormMessage, Message } from "@/components/form-message";
import { useState, useEffect } from "react";
import SpeechToTextModal from "./SpeechToTextModal";
import { Sparkles } from "lucide-react";
import SampleAnswers from "./SampleAnswers";
import { useMultiTenant } from "@/app/context/MultiTenantContext";
import { uploadFile } from "@/utils/storage";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";
import QuestionFeedback from "@/components/ui/question-feedback";

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
  })[];
  currentSubmission:
    | (Tables<"custom_job_question_submissions"> & {
        custom_job_question_submission_feedback: Tables<"custom_job_question_submission_feedback">[];
      })
    | null;
  sampleAnswers: Tables<"custom_job_question_sample_answers">[];
  coachUserId: string | null;
}) {
  const t = useTranslations("interviewQuestion");
  const [_, submitAnswerAction, isSubmitAnswerPending] = useActionState(
    submitAnswer,
    null
  );
  const [__, generateAnswerAction, isGenerateAnswerPending] = useActionState(
    generateAnswer,
    null
  );
  const initialAnswer = currentSubmission?.answer ?? "";
  const [currentAnswer, setCurrentAnswer] = useState(initialAnswer);
  const currentAudioBlob = useRef<Blob | null>(null);
  const currentAudioDuration = useRef<number>(0);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const hasAnswerChanged = currentAnswer !== initialAnswer;
  const { isCoachProgramsPage } = useMultiTenant();
  const { logInfo, logError } = useAxiomLogging();
  const [submitting, startSubmitting] = useTransition();

  useEffect(() => {
    setCurrentAnswer(initialAnswer);
    currentAudioBlob.current = null; // Clear audio blob when switching submissions
    currentAudioDuration.current = 0; // Clear audio duration when switching submissions
  }, [initialAnswer]);

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

  const searchParams = useSearchParams();
  const error = searchParams?.get("error") as string;
  const view = searchParams?.get("view") || "question";
  let formMessage: Message | null = null;
  if (error) {
    formMessage = {
      error,
    };
  }
  const { baseUrl } = useMultiTenant();
  const questionPath = `${baseUrl}/${jobId}/questions/${question.id}`;

  const newViewParams = new URLSearchParams(searchParams ?? {});
  newViewParams.set("view", view === "question" ? "submissions" : "question");

  const handleSubmitAnswer = async (formData: FormData) => {
    try {
      // If there's an audio blob, upload it first
      if (currentAudioBlob.current) {
        setIsUploadingAudio(true);
        setUploadProgress(0);

        const supabase = createSupabaseBrowserClient();
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          logError("Failed to get user for audio upload", { userError });
          throw new Error("Authentication required for audio upload");
        }

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session) {
          logError("Failed to get session for audio upload", { sessionError });
          throw new Error("Session required for audio upload");
        }

        const fileName = `${Date.now()}.webm`;
        const filePath = `${user.id}${coachUserId && `/coaches/${coachUserId}`}/programs/${jobId}/questions/${question.id}/${fileName}`;

        // Convert blob to File
        const audioFile = new File([currentAudioBlob.current], fileName, {
          type: currentAudioBlob.current.type || "audio/webm",
        });

        await uploadFile({
          bucketName: "user-files",
          filePath,
          file: audioFile,
          setProgress: setUploadProgress,
          onComplete: () => {
            logInfo("Audio file uploaded successfully", { filePath });
            // Now submit the answer with the form data (including audio file path if uploaded)
            startSubmitting(() => {
              formData.append("bucketName", "user-files");
              formData.append("filePath", filePath);
              formData.append(
                "audioRecordingDuration",
                currentAudioDuration.current.toString()
              );
              submitAnswerAction(formData);
            });
            setIsUploadingAudio(false);
          },
          accessToken: session.access_token,
          logError,
          logInfo,
        });
      } else {
        // No audio blob, submit answer directly
        startSubmitting(() => {
          submitAnswerAction(formData);
        });
      }
    } catch (error) {
      logError("Error in handleSubmitAnswer", { error });
      setIsUploadingAudio(false);
    }
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await handleSubmitAnswer(formData);
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex justify-between items-center">
            <CardTitle>
              {view === "question" ? t("questionLabel") : t("submissionsLabel")}
            </CardTitle>
            <Link
              href={`${baseUrl}/${jobId}/questions/${question.id}?${newViewParams.toString()}`}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
            >
              {view === "question"
                ? t("submissionsLabel")
                : t("backToQuestion")}
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {view === "question" ? (
            <>
              <p>{question.question}</p>
              <Separator />
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex gap-4 items-center w-full justify-between">
                    <Label htmlFor="answer">{t("answerLabel")}</Label>
                    <div className="flex gap-2">
                      <SpeechToTextModal
                        disabled={
                          isGenerateAnswerPending || isSubmitAnswerPending
                        }
                        onTranscriptionComplete={(
                          text: string,
                          audioBlob: Blob,
                          duration: number
                        ) => {
                          setCurrentAnswer(text);
                          currentAudioBlob.current = audioBlob;
                          currentAudioDuration.current = duration;
                        }}
                      />
                      {!isCoachProgramsPage && (
                        <form action={generateAnswerAction}>
                          <input
                            type="hidden"
                            name="questionId"
                            value={question.id}
                          />
                          <input type="hidden" name="jobId" value={jobId} />
                          <input
                            type="hidden"
                            name="questionPath"
                            value={questionPath}
                          />
                          <AIButton
                            type="submit"
                            disabled={
                              isGenerateAnswerPending || isSubmitAnswerPending
                            }
                            pending={isGenerateAnswerPending}
                            pendingText={t("buttons.generatingAnswer")}
                            variant="outline"
                          >
                            {t("buttons.generateAnswer")}
                          </AIButton>
                        </form>
                      )}
                    </div>
                  </div>
                  <form onSubmit={handleFormSubmit}>
                    <div className="relative">
                      <Textarea
                        id="answer"
                        name="answer"
                        rows={8}
                        placeholder={t("answerPlaceholder")}
                        value={currentAnswer}
                        onChange={(e) => setCurrentAnswer(e.target.value)}
                        disabled={
                          isSubmitAnswerPending ||
                          isGenerateAnswerPending ||
                          isUploadingAudio
                        }
                        className={
                          isGenerateAnswerPending ||
                          isSubmitAnswerPending ||
                          isUploadingAudio
                            ? "opacity-50"
                            : ""
                        }
                      />
                      {isGenerateAnswerPending && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                          <div className="animate-pulse text-muted-foreground">
                            {t("buttons.generatingAnswer")}...
                          </div>
                        </div>
                      )}
                      {isUploadingAudio && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80">
                          <div className="animate-pulse text-muted-foreground mb-2">
                            {t("uploadingAudio")}
                          </div>
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                      {isSubmitAnswerPending && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80">
                          {/* Simple loading spinner */}
                          <div className="relative w-8 h-8 mb-4">
                            <div className="absolute inset-0 border-2 border-gray-200 dark:border-gray-700 rounded-full"></div>
                            <div className="absolute inset-0 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                          </div>

                          <div className="text-center space-y-1">
                            <div className="text-sm font-medium text-muted-foreground">
                              {t("generatingFeedback")}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <input type="hidden" name="jobId" value={jobId} />
                    <input
                      type="hidden"
                      name="questionId"
                      value={question.id}
                    />
                    <input
                      type="hidden"
                      name="questionPath"
                      value={questionPath}
                    />
                    <SubmitButton
                      className="mt-4"
                      disabled={
                        isGenerateAnswerPending ||
                        isSubmitAnswerPending ||
                        isUploadingAudio ||
                        !hasAnswerChanged
                      }
                      pendingText={
                        isUploadingAudio
                          ? t("buttons.uploadingAudio")
                          : t("buttons.submitting")
                      }
                      type="submit"
                    >
                      {t("buttons.submit")}
                    </SubmitButton>
                  </form>
                  {formMessage && <FormMessage message={formMessage} />}
                </div>
              </div>
            </>
          ) : (
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
                              date: formatDate(new Date(submission.created_at)),
                            })}
                          </p>
                        </div>
                        <p>{submission.answer}</p>
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
          )}
        </CardContent>
      </Card>
      {view === "question" && (
        <>
          {manualFeedback && (
            <Card className="mt-6 border-4 border-yellow-400 bg-yellow-50/80 shadow-xl relative overflow-visible">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="rounded-lg bg-white/80 dark:bg-yellow-100/10 p-6 overflow-y-auto border border-yellow-200 max-h-[400px] relative shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles
                          className="w-5 h-5 text-yellow-500"
                          fill="currentColor"
                        />
                        <h3 className="font-semibold text-lg text-yellow-900">
                          {t("pros")}
                        </h3>
                      </div>
                      <div className="space-y-3">
                        {manualFeedback.pros.length === 0 ? (
                          <p className="text-yellow-800 italic">
                            {t("noPros")}
                          </p>
                        ) : (
                          manualFeedback.pros.map(
                            (pro: string, index: number) => (
                              <div
                                key={index}
                                className="flex gap-2 items-start"
                              >
                                <span className="text-yellow-600 mt-1">•</span>
                                <p className="text-yellow-900">{pro}</p>
                              </div>
                            )
                          )
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
                          {t("areasToImprove")}
                        </h3>
                      </div>
                      <div className="space-y-3">
                        {manualFeedback.cons.length === 0 ? (
                          <p className="text-yellow-800 italic">
                            {t("noAreasToImprove")}
                          </p>
                        ) : (
                          manualFeedback.cons.map(
                            (con: string, index: number) => (
                              <div
                                key={index}
                                className="flex gap-2 items-start"
                              >
                                <span className="text-yellow-600 mt-1">•</span>
                                <p className="text-yellow-900">{con}</p>
                              </div>
                            )
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          {feedback && <QuestionFeedback feedback={feedback} />}
          <AnswerGuideline question={question} />
          <SampleAnswers sampleAnswers={sampleAnswers} />
        </>
      )}
    </div>
  );
}
