"use client";

import { SubmitButton } from "@/components/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { Tables } from "@/utils/supabase/database.types";
import { useRef, useTransition } from "react";
import { submitAnswer, generateAnswer } from "./actions";
import { useRouter, useSearchParams } from "next/navigation";
import { FormMessage, Message } from "@/components/form-message";
import { useState, useEffect } from "react";
import { useMultiTenant } from "@/app/context/MultiTenantContext";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";
import { generateMuxUploadUrl } from "../../mockInterviews/[mockInterviewId]/actions";
import { useToast } from "@/hooks/use-toast";
import UploadNotification from "./UploadNotification";

import { useActionState } from "react";
import { Mic, MicOff, Video } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  MediaDeviceProvider,
  useMediaDevice,
} from "../../mockInterviews/[mockInterviewId]/MediaDeviceContext";

interface AnswerInputSectionProps {
  question: Tables<"custom_job_questions">;
  jobId: string;
  currentSubmission:
    | (Tables<"custom_job_question_submissions"> & {
        custom_job_question_submission_feedback: Tables<"custom_job_question_submission_feedback">[];
        mux_metadata?: Tables<"custom_job_question_submission_mux_metadata"> | null;
      })
    | null;
  coachUserId: string | null;
}

// Universal Loading Overlay Component
const UniversalLoadingOverlay = ({
  isVisible,
  message,
}: {
  isVisible: boolean;
  message: string;
}) => {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 rounded-md z-10">
      <div className="relative w-8 h-8 mb-4">
        <div className="absolute inset-0 border-2 border-gray-200 dark:border-gray-700 rounded-full"></div>
        <div className="absolute inset-0 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
      <div className="text-center space-y-1">
        <div className="text-sm font-medium text-muted-foreground">
          {message}
        </div>
      </div>
    </div>
  );
};

// Text Answer Tab Component
const TextAnswerTab = ({
  currentAnswer,
  setCurrentAnswer,
  isSubmitAnswerPending,
  isGenerateAnswerPending,
  isUploadingAudio,
  handleFormSubmit,
  hasAnswerChanged,
  formMessage,
  question,
  jobId,
  questionPath,
  generateAnswerAction,
  isCoachProgramsPage,
}: {
  currentAnswer: string;
  setCurrentAnswer: (value: string) => void;
  isSubmitAnswerPending: boolean;
  isGenerateAnswerPending: boolean;
  isUploadingAudio: boolean;
  handleFormSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  hasAnswerChanged: boolean;
  formMessage: Message | null;
  question: Tables<"custom_job_questions">;
  jobId: string;
  questionPath: string;
  generateAnswerAction: (payload: FormData) => void;
  isCoachProgramsPage: boolean;
}) => {
  const t = useTranslations("interviewQuestion");
  return (
    <div className="flex flex-col gap-2">
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

      {!isCoachProgramsPage && (
        <form action={generateAnswerAction} className="w-full">
          <input type="hidden" name="questionId" value={question.id} />
          <input type="hidden" name="jobId" value={jobId} />
          <input type="hidden" name="questionPath" value={questionPath} />
          <Button
            type="submit"
            disabled={isGenerateAnswerPending || isSubmitAnswerPending}
            variant="ai"
            className="w-full"
          >
            {t("buttons.generateAnswer")}
          </Button>
        </form>
      )}
      {formMessage && <FormMessage message={formMessage} />}
    </div>
  );
};

// Audio Recording Tab Component
const AudioRecordingTabContent = ({
  handleRecordingComplete,
  onRecordingStateChange,
  onProcessingStateChange,
  t,
}: {
  handleRecordingComplete: (
    text: string,
    audioBlob: Blob,
    duration: number
  ) => void;
  onRecordingStateChange: (isRecording: boolean) => void;
  onProcessingStateChange: (isProcessing: boolean) => void;
  t: any;
}) => {
  const [error, setError] = useState<string | null>(null);
  const recordingStartTimeRef = useRef<number>(0);
  const { logError } = useAxiomLogging();

  const {
    audioDevices,
    selectedAudio,
    isRecording,
    isProcessing,
    isRecordingTestAudio,
    testRecording,
    isInitialized,
    setSelectedAudio,
    startTestRecording,
    stopTestRecording,
    startRecording,
    stopRecording,
    initializeRecording,
  } = useMediaDevice();

  // Notify parent of recording state changes
  useEffect(() => {
    onRecordingStateChange(isRecording);
  }, [isRecording, onRecordingStateChange]);

  useEffect(() => {
    initializeRecording();
  }, []);

  const audioRecordingCompletedCallback = async (audioChunks: Blob[]) => {
    const duration =
      recordingStartTimeRef.current > 0
        ? Math.round((Date.now() - recordingStartTimeRef.current) / 1000)
        : 0;

    const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
    const formData = new FormData();
    formData.append("audioFileToTranscribe", audioBlob);
    formData.append("source", "practiceQuestion");

    try {
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Transcription failed");
      }

      const { transcription } = (await response.json()) as {
        transcription: string;
      };

      if (transcription) {
        handleRecordingComplete(transcription, audioBlob, duration);
      }
    } catch (error: any) {
      logError("Error processing recording:", { error: error.message });
      setError(error.message);
    }
  };

  const handleStartRecording = async () => {
    try {
      recordingStartTimeRef.current = Date.now();
      await startRecording({ audioRecordingCompletedCallback });
    } catch (error: any) {
      logError("Error starting audio recording:", { error: error.message });
      setError(error.message);
    }
  };

  const handleStopRecording = async () => {
    await stopRecording();
  };

  // Notify parent of processing state changes
  useEffect(() => {
    onProcessingStateChange(isProcessing);
  }, [isProcessing, onProcessingStateChange]);

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">
          {t("speechToText.selectMicrophone")}
        </label>
        <Select value={selectedAudio} onValueChange={setSelectedAudio}>
          <SelectTrigger>
            <SelectValue
              placeholder={t("speechToText.selectMicrophonePlaceholder")}
            />
          </SelectTrigger>
          <SelectContent>
            {audioDevices.map((device) => (
              <SelectItem key={device.deviceId} value={device.deviceId}>
                {device.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Test Recording Section */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          {t("speechToText.testMicrophone")}
        </label>
        <Button
          onClick={
            isRecordingTestAudio ? stopTestRecording : startTestRecording
          }
          disabled={
            !selectedAudio || isRecording || isProcessing || !isInitialized
          }
          variant={isRecordingTestAudio ? "destructive" : "secondary"}
          className="w-full"
        >
          {isRecordingTestAudio ? (
            <>
              <MicOff className="w-4 h-4 mr-2" />
              {t("speechToText.stopTestRecording")}
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 mr-2" />
              {t("speechToText.testRecording")}
            </>
          )}
        </Button>
      </div>

      <Separator />

      {/* Main Recording Button */}
      <Button
        onClick={isRecording ? handleStopRecording : handleStartRecording}
        disabled={
          !selectedAudio ||
          isProcessing ||
          testRecording !== null ||
          !isInitialized ||
          isRecordingTestAudio
        }
        variant={isRecording ? "destructive" : "default"}
        className="w-full"
      >
        {isRecording ? (
          <>
            <MicOff className="w-4 h-4 mr-2" />
            {t("speechToText.stopRecording")}
          </>
        ) : (
          <>
            <Mic className="w-4 h-4 mr-2" />
            {t("speechToText.startRecording")}
          </>
        )}
      </Button>
      {error && <div className="text-center text-sm text-red-500">{error}</div>}
    </div>
  );
};

// Video Recording Tab Component
const VideoRecordingTabContent = ({
  handleRecordingComplete,
  onRecordingStateChange,
  onProcessingStateChange,
  t,
}: {
  handleRecordingComplete: (
    text: string,
    audioBlob: Blob,
    duration: number,
    videoBlob?: Blob
  ) => void;
  onRecordingStateChange: (isRecording: boolean) => void;
  onProcessingStateChange: (isProcessing: boolean) => void;
  t: any;
}) => {
  const [error, setError] = useState<string | null>(null);
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  const recordingStartTimeRef = useRef<number>(0);
  const { logError } = useAxiomLogging();

  const {
    audioDevices,
    videoDevices,
    selectedAudio,
    selectedVideo,
    isRecording,
    isProcessing,
    isRecordingTestAudio,
    testRecording,
    isInitialized,
    setSelectedAudio,
    setSelectedVideo,
    startTestRecording,
    stopTestRecording,
    startRecording,
    stopRecording,
    initializeRecording,
    stream,
  } = useMediaDevice();

  // Notify parent of recording state changes
  useEffect(() => {
    onRecordingStateChange(isRecording);
  }, [isRecording, onRecordingStateChange]);

  useEffect(() => {
    initializeRecording();
  }, []);

  useEffect(() => {
    if (video && stream) {
      video.srcObject = stream;
    }
  }, [stream, video]);

  const audioRecordingCompletedCallback = async (audioChunks: Blob[]) => {
    const duration =
      recordingStartTimeRef.current > 0
        ? Math.round((Date.now() - recordingStartTimeRef.current) / 1000)
        : 0;

    const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
    const formData = new FormData();
    formData.append("audioFileToTranscribe", audioBlob);
    formData.append("source", "practiceQuestion");

    try {
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Transcription failed");
      }

      const { transcription } = (await response.json()) as {
        transcription: string;
      };

      if (transcription) {
        // Get the video blob that was stored during recording
        const storedVideoBlob = videoRecordingBlobRef.current;
        handleRecordingComplete(
          transcription,
          audioBlob,
          duration,
          storedVideoBlob || undefined
        );
      }
    } catch (error: any) {
      logError("Error processing recording:", { error: error.message });
      setError(error.message);
    }
  };

  const videoRecordingBlobRef = useRef<Blob | null>(null);

  const videoRecordingCompletedCallback = async (videoChunks: Blob[]) => {
    videoRecordingBlobRef.current = new Blob(videoChunks);
  };

  const handleStartRecording = async () => {
    try {
      recordingStartTimeRef.current = Date.now();
      await startRecording({
        audioRecordingCompletedCallback,
        videoRecordingCompletedCallback,
      });
    } catch (error: any) {
      logError("Error starting video recording:", { error: error.message });
      setError(error.message);
    }
  };

  const handleStopRecording = async () => {
    await stopRecording();
  };

  // Notify parent of processing state changes
  useEffect(() => {
    onProcessingStateChange(isProcessing);
  }, [isProcessing, onProcessingStateChange]);

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">
            {t("speechToText.selectCamera")}
          </label>
          <Select value={selectedVideo} onValueChange={setSelectedVideo}>
            <SelectTrigger>
              <SelectValue
                placeholder={t("speechToText.selectCameraPlaceholder")}
              />
            </SelectTrigger>
            <SelectContent>
              {videoDevices.map((device) => (
                <SelectItem key={device.deviceId} value={device.deviceId}>
                  {device.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">
            {t("speechToText.selectMicrophone")}
          </label>
          <Select value={selectedAudio} onValueChange={setSelectedAudio}>
            <SelectTrigger>
              <SelectValue
                placeholder={t("speechToText.selectMicrophonePlaceholder")}
              />
            </SelectTrigger>
            <SelectContent>
              {audioDevices.map((device) => (
                <SelectItem key={device.deviceId} value={device.deviceId}>
                  {device.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Video Preview */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          {t("speechToText.testMicrophone")}
        </label>
        <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden">
          <video
            ref={setVideo}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transform scale-x-[-1]"
          />
        </div>
        <Button
          onClick={
            isRecordingTestAudio ? stopTestRecording : startTestRecording
          }
          disabled={
            !selectedAudio || isRecording || isProcessing || !isInitialized
          }
          variant={isRecordingTestAudio ? "destructive" : "secondary"}
          className="w-full"
        >
          {isRecordingTestAudio ? (
            <>
              <MicOff className="w-4 h-4 mr-2" />
              {t("speechToText.stopTestRecording")}
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 mr-2" />
              {t("speechToText.testRecording")}
            </>
          )}
        </Button>
      </div>

      <Separator />

      {/* Main Recording Button */}
      <Button
        onClick={isRecording ? handleStopRecording : handleStartRecording}
        disabled={
          !selectedAudio ||
          !selectedVideo ||
          isProcessing ||
          testRecording !== null ||
          !isInitialized ||
          isRecordingTestAudio
        }
        variant={isRecording ? "destructive" : "default"}
        className="w-full"
      >
        {isRecording ? (
          <>
            <MicOff className="w-4 h-4 mr-2" />
            {t("speechToText.stopRecording")}
          </>
        ) : (
          <>
            <Video className="w-4 h-4 mr-2" />
            {t("speechToText.startRecording")}
          </>
        )}
      </Button>
      {error && <div className="text-center text-sm text-red-500">{error}</div>}
    </div>
  );
};

export default function AnswerInputSection({
  question,
  jobId,
  currentSubmission,
  coachUserId,
}: AnswerInputSectionProps) {
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
  const { logError } = useAxiomLogging();
  const [submitting, startSubmitting] = useTransition();
  const router = useRouter();
  const { baseUrl } = useMultiTenant();

  // New tab state - default to video as requested
  const [activeAnswerTab, setActiveAnswerTab] = useState<
    "text" | "audio" | "video"
  >("video");

  // Track recording state to prevent tab switching
  const [isRecordingInProgress, setIsRecordingInProgress] = useState(false);

  // Track processing state from MediaDevice context
  const [isProcessingRecording, setIsProcessingRecording] = useState(false);

  useEffect(() => {
    setCurrentAnswer(initialAnswer);
    currentAudioBlob.current = null; // Clear audio blob when switching submissions
    currentVideoBlob.current = null; // Clear video blob when switching submissions
    currentAudioDuration.current = 0; // Clear audio duration when switching submissions
  }, [initialAnswer]);

  // Auto-submit handler for recording tabs
  const handleRecordingComplete = async (
    transcription: string,
    audioBlob: Blob,
    duration: number,
    videoBlob?: Blob
  ) => {
    // Store blobs
    currentAudioBlob.current = audioBlob;
    currentAudioDuration.current = duration;
    if (videoBlob) {
      currentVideoBlob.current = videoBlob;
    }

    // Create form data with transcription (auto-submit)
    const formData = new FormData();
    formData.append("answer", transcription);
    formData.append("jobId", jobId);
    formData.append("questionId", question.id);
    formData.append("questionPath", questionPath);

    // Auto-submit
    await handleSubmitAnswer(formData);
  };

  // Callback to track recording state changes
  const handleRecordingStateChange = (isRecording: boolean) => {
    setIsRecordingInProgress(isRecording);
  };

  // Callback to track processing state changes
  const handleProcessingStateChange = (isProcessing: boolean) => {
    setIsProcessingRecording(isProcessing);
  };

  // Tab switching logic with recording prevention
  const handleTabChange = (newTab: "text" | "audio" | "video") => {
    // Prevent switching during recording or uploading
    if (isRecordingInProgress || isUploadingAudio) {
      toast({
        variant: "destructive",
        title: "Cannot switch tabs",
        description: isRecordingInProgress
          ? "Cannot switch tabs during recording"
          : "Please wait for the current operation to complete",
      });
      return;
    }
    setActiveAnswerTab(newTab);
  };

  // Determine if any operation is pending
  const isAnyOperationPending =
    isSubmitAnswerPending ||
    isGenerateAnswerPending ||
    isUploadingAudio ||
    isProcessingRecording;

  // Get the appropriate loading message
  const getLoadingMessage = () => {
    if (isGenerateAnswerPending) return t("buttons.generatingAnswer");
    if (isUploadingAudio) return t("buttons.uploadingAudio");
    if (isProcessingRecording) return t("speechToText.processing");
    if (isSubmitAnswerPending) return t("generatingFeedback");
    return t("generatingFeedback");
  };

  useEffect(() => {
    const uploadRecording = async ({
      chunks,
      filePath,
      submissionId,
    }: {
      chunks: Blob;
      filePath: string;
      submissionId: string;
    }) => {
      try {
        setIsUploadingAudio(true);
        await Promise.all([
          saveRecordingInSupabaseStorage({
            chunks,
            filePath,
          }),
          saveRecordingInMux({
            submissionId,
            chunks,
          }),
        ]);
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
    if (submitAnswerState && submitAnswerState.submissionId) {
      const { submissionId, filePath } = submitAnswerState;
      let chunks;
      if (currentVideoBlob.current) {
        chunks = currentVideoBlob.current;
      } else if (currentAudioBlob.current) {
        chunks = currentAudioBlob.current;
      }
      if (chunks && filePath) {
        uploadRecording({
          chunks,
          filePath,
          submissionId,
        });
      } else {
        router.push(
          `${baseUrl}/${jobId}/questions/${question.id}?submissionId=${submissionId}`
        );
      }
    }
  }, [baseUrl, jobId, question.id, submitAnswerState, router]);

  const searchParams = useSearchParams();
  const error = searchParams?.get("error") as string;
  let formMessage: Message | null = null;
  if (error) {
    formMessage = {
      error,
    };
  }
  const questionPath = `${baseUrl}/${jobId}/questions/${question.id}`;

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

      let chunks;
      if (currentVideoBlob.current) {
        chunks = currentVideoBlob.current;
      } else if (currentAudioBlob.current) {
        chunks = currentAudioBlob.current;
      }

      // If there's an audio blob, upload it first
      if (chunks) {
        const fileName = `${Date.now()}.webm`;
        const filePath = `${user.id}${coachUserId ? `/coaches/${coachUserId}` : ""}/programs/${jobId}/questions/${question.id}/${fileName}`;
        formData.append("bucketName", "user-files");
        formData.append("filePath", filePath);
        formData.append(
          "audioRecordingDuration",
          currentAudioDuration.current.toString()
        );
      }
      // No audio blob, submit answer directly
      startSubmitting(() => {
        submitAnswerAction(formData);
      });
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
        filePath,
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
    <div className="flex flex-col gap-4 h-full">
      <UploadNotification isVisible={isUploadingAudio} />

      {/* Answer Input Card */}
      <Card className="flex-1">
        {/* Tab Navigation */}
        <CardContent className="p-0 flex-shrink-0">
          <div className="flex border-b">
            <button
              onClick={() => handleTabChange("text")}
              className={`flex-1 px-4 py-3 text-xs font-medium border-b-2 transition-colors ${
                activeAnswerTab === "text"
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              📝 Type Answer
            </button>
            <button
              onClick={() => handleTabChange("audio")}
              className={`flex-1 px-4 py-3 text-xs font-medium border-b-2 transition-colors ${
                activeAnswerTab === "audio"
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              🎤 Audio Recording
            </button>
            <button
              onClick={() => handleTabChange("video")}
              className={`flex-1 px-4 py-3 text-xs font-medium border-b-2 transition-colors ${
                activeAnswerTab === "video"
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              🎥 Video Recording
            </button>
          </div>
        </CardContent>

        {/* Tab Content */}
        <CardContent className="flex-1 overflow-y-auto p-2 relative">
          {/* Universal Loading Overlay */}
          <UniversalLoadingOverlay
            isVisible={isAnyOperationPending}
            message={getLoadingMessage()}
          />

          {activeAnswerTab === "text" && (
            <TextAnswerTab
              currentAnswer={currentAnswer}
              setCurrentAnswer={setCurrentAnswer}
              isSubmitAnswerPending={isSubmitAnswerPending}
              isGenerateAnswerPending={isGenerateAnswerPending}
              isUploadingAudio={isUploadingAudio}
              handleFormSubmit={handleFormSubmit}
              hasAnswerChanged={hasAnswerChanged}
              formMessage={formMessage}
              question={question}
              jobId={jobId}
              questionPath={questionPath}
              generateAnswerAction={generateAnswerAction}
              isCoachProgramsPage={isCoachProgramsPage}
            />
          )}

          {activeAnswerTab === "audio" && (
            <MediaDeviceProvider mediaType="audio">
              <AudioRecordingTabContent
                handleRecordingComplete={handleRecordingComplete}
                onRecordingStateChange={handleRecordingStateChange}
                onProcessingStateChange={handleProcessingStateChange}
                t={t}
              />
            </MediaDeviceProvider>
          )}

          {activeAnswerTab === "video" && (
            <MediaDeviceProvider mediaType="audio-video">
              <VideoRecordingTabContent
                handleRecordingComplete={handleRecordingComplete}
                onRecordingStateChange={handleRecordingStateChange}
                onProcessingStateChange={handleProcessingStateChange}
                t={t}
              />
            </MediaDeviceProvider>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
