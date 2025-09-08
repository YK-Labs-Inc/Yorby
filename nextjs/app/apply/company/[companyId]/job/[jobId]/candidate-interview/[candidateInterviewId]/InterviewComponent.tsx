"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Room, RoomEvent } from "livekit-client";
import { motion } from "motion/react";
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
import { triggerProcessInterview } from "./actions";

const MotionSessionView = motion.create(SessionView);

interface AppProps {
  appConfig: AppConfig;
  currentInterviewId: string;
  nextInterviewId: string | null;
  jobId: string;
  companyId: string;
  candidateId: string;
  interviewType: Enums<"job_interview_type">;
  questionDetails: (Pick<
    Tables<"company_interview_question_bank">,
    "id" | "question"
  > & {
    company_interview_coding_question_metadata?: {
      time_limit_ms: number;
    } | null;
  })[];
  enableSimliAvatar: boolean;
}

export function InterviewComponent({
  appConfig,
  currentInterviewId,
  nextInterviewId,
  jobId,
  companyId,
  candidateId,
  interviewType,
  questionDetails,
  enableSimliAvatar,
}: AppProps) {
  const room = useMemo(() => new Room(), []);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showCompletionUI, setShowCompletionUI] = useState(false);
  const [enableAiAvatar, setEnableAiAvatar] = useState(false);
  const [avatarProvider, setAvatarProvider] = useState<"bey" | "simli">(
    "simli"
  );
  const [shouldUseRealtimeMode, setShouldUseRealtimeMode] = useState(false);
  const [simliFaceId, setSimliFaceId] = useState<string>(
    "cace3ef7-a4c4-425d-a8cf-a5358eb0c427"
  );
  const {
    connectionDetails,
    fetchConnectionDetails,
    refreshConnectionDetails,
    isConnecting: isConnectionDetailsLoading,
  } = useConnectionDetails({
    kind: "candidate",
    id: currentInterviewId,
    enableAiAvatar,
    avatarProvider,
    livekitMode:
      interviewType === "coding"
        ? "realtime"
        : shouldUseRealtimeMode
          ? "realtime"
          : "pipeline",
    simliFaceId,
  });
  const [localUserChoices, setLocalUserChoices] = useState<LocalUserChoices>();
  const { logError } = useAxiomLogging();
  const t = useTranslations("apply.interviews.livekit");
  const tInterview = useTranslations("apply.candidateInterview");

  const processInterview = useCallback(async () => {
    try {
      if (nextInterviewId) {
        setShowCompletionUI(true);
      } else {
        triggerProcessInterview(candidateId).then(() => {
          setShowCompletionUI(true);
        });
      }
      return "Interview processed";
    } catch (error) {
      // Error handling is done in onError callback
      return "Interview processing failed";
    }
  }, []);

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
          fetchConnectionDetails();
        }}
        enableAiAvatar={enableAiAvatar}
        setEnableAiAvatar={setEnableAiAvatar}
        avatarProvider={avatarProvider}
        setAvatarProvider={setAvatarProvider}
        shouldUseRealtimeMode={shouldUseRealtimeMode}
        setShouldUseRealtimeMode={setShouldUseRealtimeMode}
        enableSimliAvatar={enableSimliAvatar}
        simliFaceId={simliFaceId}
        setSimliFaceId={setSimliFaceId}
      />
    );
  }

  // Show completion UI when interview is complete
  if (showCompletionUI) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full px-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
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
                {tInterview("interviewComplete")}
              </h2>
              {nextInterviewId ? (
                <>
                  <p className="text-gray-600 mb-6">
                    {tInterview("interviewProcessed.nextRound")}
                  </p>
                  <Button asChild>
                    <Link href={nextUrl}>
                      {tInterview("buttons.continueToNext")}
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-gray-600 mb-4">
                    {tInterview("interviewProcessed.allComplete")}
                  </p>
                  <div className="bg-blue-50 rounded-lg p-4 mb-6">
                    <p className="text-sm text-blue-900 font-semibold mb-2">
                      {tInterview("interviewProcessed.prepareForMore")}
                    </p>
                    <p className="text-sm text-blue-700">
                      {tInterview("interviewProcessed.practiceDescription")}
                    </p>
                  </div>
                  <Button asChild>
                    <Link href="/dashboard/jobs?newJob=true">
                      {tInterview("buttons.practiceInterview")}
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

  if (isConnectionDetailsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full px-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <div className="mb-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
              </div>
              <h2 className="text-xl font-semibold mb-2">
                {t("connecting.title")}
              </h2>
              <p className="text-gray-600">{t("connecting.description")}</p>
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 0.5,
              ease: "linear",
            }}
            interviewId={currentInterviewId}
            interviewType={interviewType}
            questionDetails={questionDetails}
            realtimeMode={shouldUseRealtimeMode}
          />
        </RoomContext.Provider>

        <Toaster />
      </div>
    </>
  );
}
