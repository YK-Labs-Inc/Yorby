"use client";

import { useMemo, useState, useEffect } from "react";
import { CodeEditor } from "@/components/ui/code-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChatEntry } from "@/app/components/livekit/chat/chat-entry";
import { VideoTile } from "@/app/components/livekit/video-tile";
import { Track } from "livekit-client";
import {
  type ReceivedChatMessage,
  useLocalParticipant,
  useChat,
} from "@livekit/components-react";
import { Tables } from "@/utils/supabase/database.types";
import { saveCodingSubmission } from "./actions";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { useTranslations } from "next-intl";
import { Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAgentControlBar } from "@/app/components/livekit/agent-control-bar/hooks/use-agent-control-bar";

interface CodingInterviewComponentProps {
  aiMessages: ReceivedChatMessage[];
  questionDetails: (Pick<
    Tables<"company_interview_question_bank">,
    "id" | "question"
  > & {
    company_interview_coding_question_metadata?: {
      time_limit_ms: number;
    } | null;
  })[];
  candidateInterviewId: string;
  onDisconnect: () => void;
}

export default function CodingInterviewComponent({
  aiMessages,
  questionDetails,
  candidateInterviewId,
  onDisconnect,
}: CodingInterviewComponentProps) {
  const [code, setCode] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionCount, setSubmissionCount] = useState<number>(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const t = useTranslations("apply.codingInterview");

  const { handleDisconnect } = useAgentControlBar();

  // Axiom logging
  const { logInfo, logError } = useAxiomLogging();

  // Get time limit from question metadata
  const timeLimitMs = useMemo(() => {
    if (questionDetails && questionDetails.length > 0) {
      return (
        questionDetails[0].company_interview_coding_question_metadata
          ?.time_limit_ms || null
      );
    }
    return null;
  }, [questionDetails]);

  // Initialize timer on component mount
  useEffect(() => {
    if (timeLimitMs && !startTime) {
      const now = Date.now();
      setStartTime(now);
      setTimeRemaining(timeLimitMs);
    }
  }, [timeLimitMs, startTime]);

  // Update countdown timer
  useEffect(() => {
    if (!timeLimitMs || !startTime) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, timeLimitMs - elapsed);
      setTimeRemaining(remaining);

      // Handle time expiration
      if (remaining === 0) {
        handleTimeExpired();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLimitMs, startTime]);

  // Format time for display
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Calculate timer status for visual indicators
  const getTimerStatus = () => {
    if (!timeLimitMs || timeRemaining === null) return "normal";
    const percentRemaining = (timeRemaining / timeLimitMs) * 100;

    if (timeRemaining <= 5 * 60 * 1000) return "critical"; // Last 5 minutes
    if (percentRemaining <= 50) return "warning"; // Halfway point
    return "normal";
  };

  const timerStatus = getTimerStatus();

  // Chat functionality to send messages to the agent
  const { send: sendMessage, isSending } = useChat();

  // Handle time limit expiration
  const handleTimeExpired = async () => {
    logInfo("Coding interview time expired", {
      candidateInterviewId,
      questionId: questionDetails?.[0]?.id,
      finalCodeLength: code.length,
      hasCode: !!code.trim(),
    });
    await handleSubmitCode();
    handleDisconnect();
    onDisconnect();
  };

  // Candidate camera PIP
  const { localParticipant } = useLocalParticipant();
  const cameraPublication = localParticipant.getTrackPublication(
    Track.Source.Camera
  );
  const cameraTrack = useMemo(() => {
    return cameraPublication
      ? {
          source: Track.Source.Camera,
          participant: localParticipant,
          publication: cameraPublication,
        }
      : undefined;
  }, [cameraPublication, localParticipant]);

  // Handle code submission
  const handleSubmitCode = async () => {
    if (!code.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const questionId = questionDetails?.[0]?.id;

      // Optimistically update submission count
      const newSubmissionNumber = submissionCount + 1;
      setSubmissionCount(newSubmissionNumber);

      // Save submission to database (non-blocking, fire and forget)
      if (questionId && candidateInterviewId) {
        // Create FormData for the server action
        const formData = new FormData();
        formData.append("candidateInterviewId", candidateInterviewId);
        formData.append("questionId", questionId);
        formData.append("submissionText", code);
        formData.append("submissionNumber", newSubmissionNumber.toString());

        saveCodingSubmission(formData)
          .then((result) => {
            if (result.success) {
              logInfo(t("logging.codeSubmissionSaved"), {
                candidateInterviewId,
                questionId,
                submissionNumber: newSubmissionNumber,
              });
            } else {
              // Fail silently - just log the error
              logError(t("logging.failedToSaveSubmission"), {
                candidateInterviewId,
                questionId,
                submissionNumber: newSubmissionNumber,
                error: result.error,
              });
            }
          })
          .catch((error) => {
            // Fail silently - just log the error
            logError(t("logging.unexpectedError"), {
              candidateInterviewId,
              questionId,
              submissionNumber: newSubmissionNumber,
              error: error instanceof Error ? error.message : String(error),
            });
          })
          .finally(() => {
            setIsSubmitting(false);
          });
      }

      const codeMessage = `${t("codeSubmission")}
      \n${code}`;

      // Send the code to the LiveKit agent via chat
      await sendMessage(codeMessage);

      logInfo(t("logging.codeSubmittedToAgent"), {
        candidateInterviewId,
        questionId: questionDetails?.[0]?.id,
        submissionNumber: submissionCount + 1,
        codeLength: code.length,
      });
    } catch (error) {
      logError(t("logging.errorSubmittingCode"), {
        candidateInterviewId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  return (
    <div className="relative inset-0 bg-white h-full">
      <div className="grid grid-cols-12 gap-2 h-full w-full p-2">
        {/* Question Panel - Separate Column */}
        {questionDetails && questionDetails.length > 0 && (
          <div className="col-span-12 md:col-span-3 lg:col-span-3">
            <Card className="sticky top-4 h-[calc(100vh-11rem)] flex flex-col">
              <CardHeader>
                <div className="space-y-2">
                  <CardTitle className="text-base">
                    {t("problemStatement")}
                  </CardTitle>
                  {timeLimitMs && timeRemaining !== null && (
                    <div
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-md transition-colors",
                        timerStatus === "critical" && "bg-red-100 text-red-700",
                        timerStatus === "warning" &&
                          "bg-amber-100 text-amber-700",
                        timerStatus === "normal" && "bg-gray-100 text-gray-700"
                      )}
                    >
                      {timerStatus === "critical" ? (
                        <AlertCircle className="h-4 w-4" />
                      ) : (
                        <Clock className="h-4 w-4" />
                      )}
                      <span className="font-mono font-semibold">
                        {formatTime(timeRemaining)}
                      </span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto">
                <div className="text-sm whitespace-pre-wrap">
                  {questionDetails[0].question}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Editor Area */}
        <div
          className={`${
            questionDetails && questionDetails.length > 0
              ? "col-span-12 md:col-span-6 lg:col-span-6"
              : "col-span-12 md:col-span-8 lg:col-span-9"
          } flex flex-col`}
        >
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base text-muted-foreground font-normal">
                  {t("writeSolution")}
                </CardTitle>
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    onClick={handleSubmitCode}
                    disabled={
                      isSubmitting ||
                      isSending ||
                      !code.trim() ||
                      (timeRemaining !== null && timeRemaining === 0)
                    }
                  >
                    {isSubmitting
                      ? t("submitting")
                      : timeRemaining !== null && timeRemaining === 0
                        ? t("timeUp")
                        : t("submitCode")}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 pb-4">
              <CodeEditor
                value={code}
                onChange={setCode}
                placeholder={t("startCoding")}
                className="h-full"
                minHeight="100%"
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Rail: video tiles + transcript */}
        <aside className="col-span-12 md:col-span-3 lg:col-span-3">
          <Card className="sticky top-4 h-[calc(100vh-11rem)] flex flex-col">
            <CardContent className="pt-6 space-y-4 overflow-y-auto">
              {/* Video tile */}
              <div className="space-y-2">
                <div className="relative h-32 rounded-md overflow-hidden bg-muted/10 border">
                  {cameraTrack ? (
                    <VideoTile
                      trackRef={cameraTrack}
                      className="h-full w-full [&>video]:h-full [&>video]:w-full [&>video]:object-cover"
                    />
                  ) : (
                    <div className="h-full w-full grid place-items-center text-muted-foreground text-sm">
                      {t("cameraOff")}
                    </div>
                  )}
                  <div className="absolute bottom-1 right-1 bg-black/70 text-white px-2 py-0.5 rounded text-xs">
                    {t("you")}
                  </div>
                </div>
              </div>

              {/* Transcript */}
              <div>
                <h4 className="text-sm font-medium mb-2">
                  {t("aiTranscript")}
                </h4>
                <div className="space-y-2">
                  {aiMessages.length > 0 && (
                    <div className="bg-muted/10 rounded-md p-2 border">
                      <ChatEntry
                        hideName
                        hideTimestamp
                        entry={aiMessages[aiMessages.length - 1]}
                        className="[&>*]:!bg-transparent"
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
