"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from "next-intl";
import { useMediaDevice, MediaDevice } from "../shared/MediaDeviceContext";
import { Video, VideoOff, Mic, MicOff, Upload, Eye } from "lucide-react";
import { Tables } from "@/utils/supabase/database.types";
import { submitAnswer } from "../actions";
import { SubmitButton } from "@/components/submit-button";
import { useActionState, useTransition } from "react";
import { FormMessage, Message } from "@/components/form-message";
import { useSearchParams } from "next/navigation";
import { useMultiTenant } from "@/app/context/MultiTenantContext";
import { uploadFile } from "@/utils/storage";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";

interface VideoRecordingAreaProps {
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
  coachUserId: string | null;
}

export default function VideoRecordingArea({
  question,
  jobId,
  submissions,
  currentSubmission,
  coachUserId,
}: VideoRecordingAreaProps) {
  const t = useTranslations("interviewQuestion");
  const [_, submitAnswerAction, isSubmitAnswerPending] = useActionState(
    submitAnswer,
    null
  );
  const [submitting, startSubmitting] = useTransition();

  const {
    videoDevices,
    audioDevices,
    selectedVideo,
    selectedAudio,
    stream,
    isRecording,
    isProcessing,
    setSelectedVideo,
    setSelectedAudio,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useMediaDevice();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playbackVideoRef = useRef<HTMLVideoElement | null>(null);
  const currentVideoBlob = useRef<Blob | null>(null);
  const currentVideoDuration = useRef<number>(0);
  const recordingStartTime = useRef<number>(0);

  const [currentAnswer, setCurrentAnswer] = useState(
    currentSubmission?.answer ?? ""
  );
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  const { baseUrl } = useMultiTenant();
  const { logInfo, logError } = useAxiomLogging();
  const searchParams = useSearchParams();

  const error = searchParams?.get("error") as string;
  let formMessage: Message | null = null;
  if (error) {
    formMessage = { error };
  }

  const questionPath = `${baseUrl}/${jobId}/questions/${question.id}`;
  const hasAnswerChanged = currentAnswer !== (currentSubmission?.answer ?? "");
  const hasRecordedVideo = recordedVideoUrl !== null;

  // Set up video preview
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Clean up video URLs on unmount
  useEffect(() => {
    return () => {
      if (recordedVideoUrl) {
        URL.revokeObjectURL(recordedVideoUrl);
      }
    };
  }, [recordedVideoUrl]);

  const handleStartRecording = async () => {
    recordingStartTime.current = Date.now();
    await startRecording({
      videoRecordingCompletedCallback: async (videoBlob: Blob[]) => {
        const blob = new Blob(videoBlob, { type: "video/webm" });
        currentVideoBlob.current = blob;
        currentVideoDuration.current = Math.round(
          (Date.now() - recordingStartTime.current) / 1000
        );

        // Create URL for preview
        const url = URL.createObjectURL(blob);
        setRecordedVideoUrl(url);
        setShowPreview(true);
      },
    });
  };

  const handleStopRecording = async () => {
    await stopRecording();
  };

  const handleCancelRecording = () => {
    cancelRecording();
    if (recordedVideoUrl) {
      URL.revokeObjectURL(recordedVideoUrl);
      setRecordedVideoUrl(null);
    }
    currentVideoBlob.current = null;
    currentVideoDuration.current = 0;
    setShowPreview(false);
  };

  const handleRetakeVideo = () => {
    if (recordedVideoUrl) {
      URL.revokeObjectURL(recordedVideoUrl);
      setRecordedVideoUrl(null);
    }
    currentVideoBlob.current = null;
    currentVideoDuration.current = 0;
    setShowPreview(false);
  };

  const handleSubmitAnswer = async (formData: FormData) => {
    try {
      // If there's a video blob, upload it first
      if (currentVideoBlob.current) {
        setIsUploadingVideo(true);
        setUploadProgress(0);

        const supabase = createSupabaseBrowserClient();
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          logError("Failed to get user for video upload", { userError });
          throw new Error("Authentication required for video upload");
        }

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session) {
          logError("Failed to get session for video upload", { sessionError });
          throw new Error("Session required for video upload");
        }

        const fileName = `${Date.now()}.webm`;
        const filePath = `${user.id}${
          coachUserId && `/coaches/${coachUserId}`
        }/programs/${jobId}/questions/${question.id}/${fileName}`;

        // Convert blob to File
        const videoFile = new File([currentVideoBlob.current], fileName, {
          type: currentVideoBlob.current.type || "video/webm",
        });

        await uploadFile({
          bucketName: "user-files",
          filePath,
          file: videoFile,
          setProgress: setUploadProgress,
          onComplete: () => {
            logInfo("Video file uploaded successfully", { filePath });
            // Now submit the answer with the form data
            startSubmitting(() => {
              formData.append("bucketName", "user-files");
              formData.append("filePath", filePath);
              formData.append(
                "videoRecordingDuration",
                currentVideoDuration.current.toString()
              );
              submitAnswerAction(formData);
            });
            setIsUploadingVideo(false);
          },
          accessToken: session.access_token,
          logError,
          logInfo,
        });
      } else {
        // No video blob, submit answer directly
        startSubmitting(() => {
          submitAnswerAction(formData);
        });
      }
    } catch (error) {
      logError("Error in handleSubmitAnswer", { error });
      setIsUploadingVideo(false);
    }
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await handleSubmitAnswer(formData);
  };

  return (
    <div className="space-y-6">
      {/* Device Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {t("videoRecording.setup", { default: "Video Setup" })}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="camera">
                {t("videoRecording.camera", { default: "Camera" })}
              </Label>
              <select
                id="camera"
                value={selectedVideo}
                onChange={(e) => setSelectedVideo(e.target.value)}
                className="w-full p-2 border rounded-md"
                disabled={isRecording}
              >
                {videoDevices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="microphone">
                {t("videoRecording.microphone", { default: "Microphone" })}
              </Label>
              <select
                id="microphone"
                value={selectedAudio}
                onChange={(e) => setSelectedAudio(e.target.value)}
                className="w-full p-2 border rounded-md"
                disabled={isRecording}
              >
                {audioDevices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Video Recording Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {t("videoRecording.title", { default: "Video Answer" })}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Camera Preview/Playback */}
            <div className="space-y-4">
              <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden relative">
                {showPreview && recordedVideoUrl ? (
                  <video
                    ref={playbackVideoRef}
                    src={recordedVideoUrl}
                    controls
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform scale-x-[-1]"
                  />
                )}

                {isRecording && (
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    <span className="text-sm font-medium">
                      {t("videoRecording.recording", { default: "Recording" })}
                    </span>
                  </div>
                )}
              </div>

              {/* Recording Controls */}
              <div className="flex flex-wrap gap-2 justify-center">
                {!isRecording && !showPreview && (
                  <Button
                    onClick={handleStartRecording}
                    disabled={!stream || isProcessing}
                    className="flex items-center gap-2"
                  >
                    <Video className="h-4 w-4" />
                    {t("videoRecording.startRecording", {
                      default: "Start Recording",
                    })}
                  </Button>
                )}

                {isRecording && (
                  <Button
                    onClick={handleStopRecording}
                    variant="destructive"
                    className="flex items-center gap-2"
                  >
                    <VideoOff className="h-4 w-4" />
                    {t("videoRecording.stopRecording", {
                      default: "Stop Recording",
                    })}
                  </Button>
                )}

                {showPreview && (
                  <>
                    <Button
                      onClick={handleRetakeVideo}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Video className="h-4 w-4" />
                      {t("videoRecording.retake", { default: "Retake" })}
                    </Button>
                    <Button
                      onClick={() => setShowPreview(false)}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      {t("videoRecording.backToCamera", {
                        default: "Back to Camera",
                      })}
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Text Answer Section */}
            <div className="space-y-4">
              <Label htmlFor="answer">
                {t("answerLabel", { default: "Your Answer" })}
              </Label>
              <form onSubmit={handleFormSubmit}>
                <div className="relative">
                  <Textarea
                    id="answer"
                    name="answer"
                    rows={8}
                    placeholder={t("answerPlaceholder", {
                      default: "Type your response here...",
                    })}
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    disabled={
                      isSubmitAnswerPending || isUploadingVideo || submitting
                    }
                    className={
                      isSubmitAnswerPending || isUploadingVideo || submitting
                        ? "opacity-50"
                        : ""
                    }
                  />

                  {isUploadingVideo && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80">
                      <div className="animate-pulse text-muted-foreground mb-2">
                        {t("uploadingVideo", { default: "Uploading video..." })}
                      </div>
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {(isSubmitAnswerPending || submitting) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80">
                      <div className="relative w-8 h-8 mb-4">
                        <div className="absolute inset-0 border-2 border-gray-200 dark:border-gray-700 rounded-full"></div>
                        <div className="absolute inset-0 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      </div>
                      <div className="text-center space-y-1">
                        <div className="text-sm font-medium text-muted-foreground">
                          {t("generatingFeedback", {
                            default: "Generating feedback...",
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <input type="hidden" name="jobId" value={jobId} />
                <input type="hidden" name="questionId" value={question.id} />
                <input type="hidden" name="questionPath" value={questionPath} />

                <SubmitButton
                  className="mt-4"
                  disabled={
                    isSubmitAnswerPending ||
                    isUploadingVideo ||
                    submitting ||
                    (!hasAnswerChanged && !hasRecordedVideo)
                  }
                  pendingText={
                    isUploadingVideo
                      ? t("buttons.uploadingVideo", {
                          default: "Uploading video...",
                        })
                      : t("buttons.submitting", { default: "Submitting..." })
                  }
                  type="submit"
                >
                  {t("buttons.submit", { default: "Submit" })}
                </SubmitButton>
              </form>

              {formMessage && <FormMessage message={formMessage} />}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
