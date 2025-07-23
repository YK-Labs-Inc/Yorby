"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Room, RoomEvent } from "livekit-client";
import { motion } from "motion/react";
import {
  PreJoin,
  RoomAudioRenderer,
  RoomContext,
  StartAudio,
} from "@livekit/components-react";
import { toastAlert } from "./alert-toast";
import type { AppConfig } from "./types";
import { SessionView } from "./session-view";
import { Toaster } from "@/components/ui/sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import useConnectionDetails from "./hooks/useConnectionDetails";
import { useRouter } from "next/navigation";
import "@livekit/components-styles";
import "./livekit-light-theme.css";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { useMultiTenant } from "@/app/context/MultiTenantContext";
import { MockInterviewPreJoin } from "./MockInterviewPreJoin";
import { RealInterviewPreJoin } from "./RealInterviewPreJoin";
import { useTranslations } from "next-intl";

const MotionSessionView = motion.create(SessionView);

interface AppProps {
  appConfig: AppConfig;
  interviewType: "mock-interview" | "real-interview";
  mockInterviewId: string;
  jobId: string;
  companyId?: string;
}

export function LiveKitInterviewComponent({
  appConfig,
  interviewType,
  mockInterviewId,
  jobId,
  companyId,
}: AppProps) {
  const room = useMemo(() => new Room(), []);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const { connectionDetails, refreshConnectionDetails } = useConnectionDetails({
    mockInterviewId,
  });
  const { logError } = useAxiomLogging();
  const router = useRouter();
  const { baseUrl } = useMultiTenant();
  const t = useTranslations("apply.interviews.livekit");
  const interviewProcessUrl = useMemo(() => {}, [
    baseUrl,
    jobId,
    mockInterviewId,
    companyId,
  ]);

  const processInterview = useCallback(async () => {
    setIsProcessing(true);
    try {
      if (!mockInterviewId) {
        throw new Error("interview id is not found");
      }
      const processingURL =
        interviewType === "mock-interview"
          ? "/api/mockInterviews/process"
          : `/api/candidate-interviews/${mockInterviewId}`;
      const response = await fetch(processingURL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mockInterviewId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to process interview: ${response.statusText}`);
      }

      // Redirect to application submitted page if companyId is present (real interview)
      // Otherwise redirect to mock interview review page
      if (companyId) {
        router.push(
          `/apply/company/${companyId}/job/${jobId}/application/submitted`
        );
      } else {
        router.push(
          `${baseUrl}/${jobId}/mockInterviews/${mockInterviewId}/review/v2`
        );
      }
    } catch (error) {
      logError("Error processing interview", {
        error,
      });
      toastAlert({
        title: t("errors.processingInterview"),
        description:
          error instanceof Error ? error.message : t("errors.unknownError"),
      });
    } finally {
      setIsProcessing(false);
      return "Interview processed";
    }
  }, [
    interviewType,
    mockInterviewId,
    router,
    baseUrl,
    jobId,
    companyId,
    logError,
    t,
  ]);

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
        mockInterviewId,
        interviewType,
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
    mockInterviewId,
    interviewType,
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
        room.localParticipant.setMicrophoneEnabled(true, undefined, {
          preConnectBuffer: appConfig.isPreConnectBufferEnabled,
        }),
        room.localParticipant.setCameraEnabled(true),
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
            mockInterviewId,
            interviewType,
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
      <>
        {interviewType === "mock-interview" ? (
          <MockInterviewPreJoin onSubmit={() => setSessionStarted(true)} />
        ) : (
          <RealInterviewPreJoin onSubmit={() => setSessionStarted(true)} />
        )}
      </>
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
          />
        </RoomContext.Provider>

        <Toaster />
      </div>

      {/* Processing Dialog */}
      <Dialog open={isProcessing} onOpenChange={() => {}}>
        <DialogContent hideClose className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("processing.title")}</DialogTitle>
            <DialogDescription>{t("processing.description")}</DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {t("processing.status")}
            </div>
            <div className="flex gap-2 items-center mt-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 dark:border-gray-100" />
              <span className="text-sm">{t("processing.wait")}</span>
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400 block mt-2">
              {t("processing.emailNotification")}
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
