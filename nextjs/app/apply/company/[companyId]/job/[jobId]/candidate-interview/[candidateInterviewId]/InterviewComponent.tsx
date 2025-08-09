"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Room, RoomEvent } from "livekit-client";
import { motion } from "motion/react";
import useSWRMutation from "swr/mutation";
import {
  LocalUserChoices,
  RoomAudioRenderer,
  RoomContext,
  StartAudio,
} from "@livekit/components-react";
import { Toaster } from "@/components/ui/sonner";
import Link from "next/link";
import "@livekit/components-styles";
import "@/app/dashboard/jobs/[jobId]/mockInterviews/[mockInterviewId]/v2/livekit-light-theme.css";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { useTranslations } from "next-intl";
import { toastAlert } from "@/app/dashboard/jobs/[jobId]/mockInterviews/[mockInterviewId]/v2/alert-toast";
import useConnectionDetails from "@/app/dashboard/jobs/[jobId]/mockInterviews/[mockInterviewId]/v2/hooks/useConnectionDetails";
import { RealInterviewPreJoin } from "@/app/dashboard/jobs/[jobId]/mockInterviews/[mockInterviewId]/v2/RealInterviewPreJoin";
import { SessionView } from "@/app/dashboard/jobs/[jobId]/mockInterviews/[mockInterviewId]/v2/session-view";
import { AppConfig } from "@/app/dashboard/jobs/[jobId]/mockInterviews/[mockInterviewId]/v2/types";
import { Button } from "@/components/ui/button";
import { Enums, Tables } from "@/utils/supabase/database.types";

const MotionSessionView = motion.create(SessionView);

interface AppProps {
  appConfig: AppConfig;
  currentInterviewId: string;
  nextInterviewId: string | null;
  jobId: string;
  companyId?: string;
  interviewType: Enums<"job_interview_type">;
  questionDetails: Pick<
    Tables<"company_interview_question_bank">,
    "id" | "question"
  >[];
}

export function InterviewComponent({
  appConfig,
  currentInterviewId,
  nextInterviewId,
  jobId,
  companyId,
  interviewType,
  questionDetails,
}: AppProps) {
  const room = useMemo(() => new Room(), []);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [isProcessingComplete, setIsProcessingComplete] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const { connectionDetails, refreshConnectionDetails } = useConnectionDetails({
    kind: "candidate",
    id: currentInterviewId,
  });
  const [localUserChoices, setLocalUserChoices] = useState<LocalUserChoices>();
  const { logError } = useAxiomLogging();
  const t = useTranslations("apply.interviews.livekit");
  const tInterview = useTranslations("apply.candidateInterview");

  // SWR mutation for processing interview
  const processInterviewFetcher = async (url: string) => {
    if (!currentInterviewId) {
      throw new Error("interview id is not found");
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to process interview: ${response.statusText}`);
    }

    return response.json();
  };

  const { trigger: triggerProcessInterview, isMutating: isProcessing } =
    useSWRMutation(
      `/api/candidate-interviews/${currentInterviewId}`,
      processInterviewFetcher,
      {
        onSuccess: () => {
          setIsProcessingComplete(true);
        },
        onError: (error) => {
          logError("Error processing interview", {
            error,
          });
          toastAlert({
            title: t("errors.processingInterview"),
            description:
              error instanceof Error ? error.message : t("errors.unknownError"),
          });
        },
      }
    );

  const processInterview = useCallback(async () => {
    try {
      await triggerProcessInterview();
      return "Interview processed";
    } catch (error) {
      // Error handling is done in onError callback
      return "Interview processing failed";
    }
  }, [triggerProcessInterview]);

  const nextUrl = useMemo(() => {
    if (!companyId) return "";
    if (nextInterviewId) {
      return `/apply/company/${companyId}/job/${jobId}/candidate-interview/${nextInterviewId}`;
    }
    return `/apply/company/${companyId}/job/${jobId}/application/submitted`;
  }, [companyId, nextInterviewId, jobId]);

  useEffect(() => {
    room.registerRpcMethod("processInterview", processInterview);

    return () => {
      room.unregisterRpcMethod("processInterview");
    };
  }, [room, processInterview]);

  useEffect(() => {
    const onMediaDevicesError = (error: Error) => {
      logError("Media devices error", {
        error: error.message,
        errorName: error.name,
        currentInterviewId,
        nextInterviewId,
      });
      toastAlert({
        title: t("errors.mediaDevices"),
        description: `${error.name}: ${error.message}`,
      });
    };
    room.on(RoomEvent.MediaDevicesError, onMediaDevicesError);
    return () => {
      room.off(RoomEvent.MediaDevicesError, onMediaDevicesError);
    };
  }, [
    room,
    refreshConnectionDetails,
    currentInterviewId,
    nextInterviewId,
    logError,
    t,
  ]);

  useEffect(() => {
    if (
      sessionStarted &&
      room.state === "disconnected" &&
      connectionDetails &&
      !isConnecting
    ) {
      setIsConnecting(true);
      Promise.all([
        room.localParticipant.setMicrophoneEnabled(
          true,
          { deviceId: localUserChoices?.audioDeviceId },
          {
            preConnectBuffer: appConfig.isPreConnectBufferEnabled,
          }
        ),
        room.localParticipant.setCameraEnabled(true, {
          deviceId: localUserChoices?.videoDeviceId,
        }),
        room.connect(
          connectionDetails.serverUrl,
          connectionDetails.participantToken
        ),
      ])
        .then(() => {
          setIsConnecting(false);
        })
        .catch((error) => {
          setIsConnecting(false);
          logError("Failed to connect to LiveKit room", {
            error: error.message,
            errorName: error.name,
            currentInterviewId,
            nextInterviewId,
            serverUrl: connectionDetails.serverUrl,
          });
          toastAlert({
            title: t("errors.connectingToAgent"),
            description: `${error.name}: ${error.message}`,
          });
        });
    }
  }, [
    room,
    sessionStarted,
    connectionDetails,
    appConfig.isPreConnectBufferEnabled,
    isConnecting,
    localUserChoices,
    t,
  ]);

  // Cleanup effect to disconnect room on unmount
  useEffect(() => {
    return () => {
      if (room.state !== "disconnected") {
        room.disconnect();
      }
    };
  }, [room]);

  if (!sessionStarted) {
    return (
      <RealInterviewPreJoin
        onSubmit={(values) => {
          setSessionStarted(true);
          setLocalUserChoices(values);
        }}
      />
    );
  }

  // Show processing UI instead of the interview component when processing
  if (isProcessing || isProcessingComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full px-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              {!isProcessingComplete ? (
                <>
                  <div className="mb-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">
                    {t("processing.title")}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {t("processing.description")}
                  </p>
                  <p className="text-sm text-gray-500">
                    {t("processing.wait")}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {t("processing.emailNotification")}
                  </p>
                </>
              ) : (
                <>
                  <div className="mb-4">
                    <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                      <svg
                        className="h-6 w-6 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  </div>
                  <h2 className="text-xl font-semibold mb-2">
                    Interview Complete!
                  </h2>
                  <p className="text-gray-600 mb-6">
                    {nextInterviewId
                      ? tInterview("interviewProcessed.nextRound")
                      : tInterview("interviewProcessed.complete")}
                  </p>
                  <Button asChild>
                    <Link href={nextUrl}>
                      {nextInterviewId
                        ? tInterview("buttons.continueToNext")
                        : tInterview("buttons.completeApplication")}
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div data-lk-theme="default">
        <RoomContext.Provider value={room}>
          <RoomAudioRenderer />
          <StartAudio label={t("labels.startAudio")} />
          <MotionSessionView
            key="session-view"
            appConfig={appConfig}
            disabled={!sessionStarted}
            sessionStarted={sessionStarted}
            onProcessInterview={processInterview}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 0.5,
              ease: "linear",
            }}
            interviewId={currentInterviewId}
            interviewType={interviewType}
            questionDetails={questionDetails}
          />
        </RoomContext.Provider>

        <Toaster />
      </div>
    </>
  );
}
