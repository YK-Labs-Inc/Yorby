"use client";

import { SubmitButton } from "@/components/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useTranslations } from "next-intl";
import { Tables } from "@/utils/supabase/database.types";
import { useActionState, useRef, useTransition } from "react";
import { submitAnswer, generateAnswer } from "./actions";
import { useRouter, useSearchParams } from "next/navigation";
import { AIButton } from "@/components/ai-button";
import AnswerGuideline from "./AnswerGuideline";
import Link from "next/link";
import { FormMessage, Message } from "@/components/form-message";
import { useState, useEffect } from "react";
import SpeechToTextModal from "./SpeechToTextModal";
import { Sparkles } from "lucide-react";
import SampleAnswers from "./SampleAnswers";
import QuestionFeedbackTab from "./QuestionFeedbackTab";
import { useMultiTenant } from "@/app/context/MultiTenantContext";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";
import { generateMuxUploadUrl } from "../../mockInterviews/[mockInterviewId]/actions";
import { useToast } from "@/hooks/use-toast";
import UploadNotification from "./UploadNotification";
import SubmissionVideoPlayer from "./SubmissionVideoPlayer";

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
  const { toast } = useToast();
  const [submitAnswerState, submitAnswerAction, isSubmitAnswerPending] =
    useActionState(submitAnswer, null);
  const [__, generateAnswerAction, isGenerateAnswerPending] = useActionState(
    generateAnswer,
    null
  );
  const initialAnswer = currentSubmission?.answer ?? "";
  const [currentAnswer, setCurrentAnswer] = useState(initialAnswer);
  const currentAudioBlob = useRef<Blob | null>(null);
  const currentVideoBlob = useRef<Blob | null>(null);
  const currentAudioDuration = useRef<number>(0);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const hasAnswerChanged = currentAnswer !== initialAnswer;
  const { isCoachProgramsPage } = useMultiTenant();
  const { logInfo, logError } = useAxiomLogging();
  const [submitting, startSubmitting] = useTransition();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<
    "question" | "guidelines" | "samples" | "submissions" | "feedback"
  >("question");

  useEffect(() => {
    setCurrentAnswer(initialAnswer);
    currentAudioBlob.current = null; // Clear audio blob when switching submissions
    currentVideoBlob.current = null; // Clear video blob when switching submissions
    currentAudioDuration.current = 0; // Clear audio duration when switching submissions
  }, [initialAnswer]);

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
  }, [currentSubmission?.id]);

  useEffect(() => {
    const uploadRecording = async ({
      chunks,
      filePath,
      submissionId,
      videoBlob,
    }: {
      chunks: Blob;
      filePath: string;
      submissionId: string;
      videoBlob: Blob | null;
    }) => {
      try {
        setIsUploadingAudio(true);
        await Promise.all(
          videoBlob
            ? [
                saveRecordingInSupabaseStorage({
                  chunks,
                  filePath,
                }),
                saveRecordingInMux({
                  submissionId,
                  chunks: videoBlob,
                }),
              ]
            : [
                saveRecordingInSupabaseStorage({
                  chunks,
                  filePath,
                }),
              ]
        );
      } catch (error) {
        logError("Error uploading recording", { error });
        toast({
          variant: "destructive",
          title: "Upload Failed",
          description: "Failed to upload your recording. Please try again.",
        });
      } finally {
        setIsUploadingAudio(false);
        router.push(
          `${baseUrl}/${jobId}/questions/${question.id}?submissionId=${submissionId}`
        );
      }
    };
    if (
      submitAnswerState &&
      submitAnswerState.submissionId &&
      submitAnswerState.filePath
    ) {
      const { submissionId, filePath } = submitAnswerState;
      let chunks: Blob;
      if (currentVideoBlob.current) {
        chunks = currentVideoBlob.current;
      } else if (currentAudioBlob.current) {
        chunks = currentAudioBlob.current;
      } else {
        logError("No chunks to upload", {
          submissionId,
          filePath,
        });
        return;
      }
      uploadRecording({
        chunks,
        filePath,
        submissionId,
        videoBlob: currentVideoBlob.current,
      });
    }
  }, [submitAnswerState]);

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
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Authentication required for audio upload");
      }

      let chunks: Blob;
      if (currentVideoBlob.current) {
        chunks = currentVideoBlob.current;
      } else if (currentAudioBlob.current) {
        chunks = currentAudioBlob.current;
      } else {
        throw new Error("No chunks to upload");
      }

      const fileName = `${Date.now()}.webm`;
      const filePath = `${user.id}${coachUserId && `/coaches/${coachUserId}`}/programs/${jobId}/questions/${question.id}/${fileName}`;
      // If there's an audio blob, upload it first
      if (chunks) {
        formData.append("bucketName", "user-files");
        formData.append("filePath", filePath);
        formData.append(
          "audioRecordingDuration",
          currentAudioDuration.current.toString()
        );
        startSubmitting(() => {
          submitAnswerAction(formData);
        });
      } else {
        // No audio blob, submit answer directly
        startSubmitting(() => {
          submitAnswerAction(formData);
        });
      }
    } catch (error) {
      logError("Error in handleSubmitAnswer", { error });
    }
  };

  const saveRecordingInSupabaseStorage = async ({
    chunks,
    filePath,
  }: {
    chunks: Blob;
    filePath: string;
  }) => {
    try {
      const supabase = createSupabaseBrowserClient();
      const fileName = filePath.split("/").pop() || `${Date.now()}.webm`;

      // Convert blob to File
      const file = new File([chunks], fileName, {
        type: chunks.type,
      });

      const { error } = await supabase.storage
        .from("user-files")
        .upload(filePath, file);
      if (error) {
        throw error;
      }
    } catch (error) {
      logError("Error uploading file to Supabase storage", {
        error,
        function: "saveRecordingInSupabaseStorage",
      });
      throw error;
    }
  };

  const saveRecordingInMux = async ({
    submissionId,
    chunks,
  }: {
    submissionId: string;
    chunks: Blob;
  }) => {
    const { uploadUrl, error } = await generateMuxUploadUrl({
      databaseId: submissionId,
      table: "custom_job_question_submission_mux_metadata",
    });
    if (error || !uploadUrl) {
      logError("Error generating Mux upload URL", { error });
      return;
    }
    try {
      const videoBlob = new Blob([chunks]);
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: videoBlob,
      });
      if (!uploadResponse.ok) {
        throw new Error("Failed to upload video to Mux");
      }
    } catch (err) {
      logError("Error uploading video to Mux", {
        error: err,
        function: "saveRecordingInMux",
      });
      throw err;
    }
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await handleSubmitAnswer(formData);
  };

  return (
    <div className="flex flex-col gap-4">
      <UploadNotification isVisible={isUploadingAudio} />
      {/* Main split layout */}
      <div className="flex gap-4 h-[calc(100vh-60px)]">
        {/* Left Side - Tabbed Content */}
        <Card className="w-1/2 flex flex-col">
          {/* Tab Navigation */}
          <CardContent className="p-0 flex-shrink-0">
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab("question")}
                className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "question"
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                📋 {t("questionLabel")}
              </button>
              <button
                onClick={() => setActiveTab("guidelines")}
                className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "guidelines"
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                📖 Guidelines
              </button>
              <button
                onClick={() => setActiveTab("samples")}
                className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "samples"
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                🧪 Samples
              </button>
              <button
                onClick={() => setActiveTab("submissions")}
                className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "submissions"
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                🔄 {t("submissionsLabel")}
              </button>
              <button
                onClick={() => setActiveTab("feedback")}
                className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
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

        {/* Right Side - Answer Input and Feedback */}
        <div className="w-1/2 flex flex-col gap-4">
          {/* Answer Input Card */}
          <Card className="flex-shrink-0">
            <CardHeader>
              <div className="flex gap-4 items-center w-full justify-between">
                <CardTitle>{t("answerLabel")}</CardTitle>
                <div className="flex gap-2">
                  <SpeechToTextModal
                    disabled={isGenerateAnswerPending || isSubmitAnswerPending}
                    onTranscriptionComplete={(
                      text: string,
                      audioBlob: Blob,
                      duration: number
                    ) => {
                      setCurrentAnswer(text);
                      currentAudioBlob.current = audioBlob;
                      currentAudioDuration.current = duration;
                    }}
                    videoRecordingCompletedCallback={async (
                      videoChunks: Blob[]
                    ) => {
                      currentVideoBlob.current = new Blob(videoChunks);
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
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
                <div className="relative">
                  <Textarea
                    id="answer"
                    name="answer"
                    placeholder={t("answerPlaceholder")}
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    disabled={
                      isSubmitAnswerPending ||
                      isGenerateAnswerPending ||
                      isUploadingAudio
                    }
                    className={`min-h-[200px] resize-none ${
                      isGenerateAnswerPending ||
                      isSubmitAnswerPending ||
                      isUploadingAudio
                        ? "opacity-50"
                        : ""
                    }`}
                  />
                  {isGenerateAnswerPending && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-md">
                      <div className="animate-pulse text-muted-foreground">
                        {t("buttons.generatingAnswer")}...
                      </div>
                    </div>
                  )}
                  {isSubmitAnswerPending && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 rounded-md">
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
                <input type="hidden" name="questionId" value={question.id} />
                <input type="hidden" name="questionPath" value={questionPath} />
                <SubmitButton
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
            </CardContent>
          </Card>

          {/* Video Player Card - only if there's a current submission with video */}
          <SubmissionVideoPlayer currentSubmission={currentSubmission} />
        </div>
      </div>
    </div>
  );
}
