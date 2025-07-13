"use client";

import { useEffect, useMemo, useState } from "react";
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
import { useParams, usePathname, useRouter } from "next/navigation";
import "@livekit/components-styles";
import "./livekit-light-theme.css";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";

const MotionSessionView = motion.create(SessionView);

interface AppProps {
  appConfig: AppConfig;
}

export function LiveKitInterviewComponent({ appConfig }: AppProps) {
  const room = useMemo(() => new Room(), []);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { mockInterviewId, jobId } = useParams<{
    mockInterviewId: string;
    jobId: string;
  }>();
  const { connectionDetails, refreshConnectionDetails } = useConnectionDetails({
    mockInterviewId,
  });
  const { logError } = useAxiomLogging();
  const router = useRouter();
  const baseUrl = usePathname();

  useEffect(() => {
    const onDisconnected = async () => {
      setIsProcessing(true);
      try {
        if (!mockInterviewId) {
          throw new Error("interview id is not found");
        }
        const response = await fetch("/api/mockInterviews/process", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mockInterviewId,
          }),
        });

        if (!response.ok) {
          throw new Error(
            `Failed to process interview: ${response.statusText}`
          );
        }
        router.push(
          `${baseUrl}/${jobId}/mockInterviews/${mockInterviewId}/review/v2`
        );
      } catch (error) {
        logError("Error processing interview", {
          error,
        });
        toastAlert({
          title: "Error processing interview",
          description: error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        setIsProcessing(false);
      }
    };
    const onMediaDevicesError = (error: Error) => {
      toastAlert({
        title: "Encountered an error with your media devices",
        description: `${error.name}: ${error.message}`,
      });
    };
    room.on(RoomEvent.MediaDevicesError, onMediaDevicesError);
    room.on(RoomEvent.Disconnected, onDisconnected);
    return () => {
      room.off(RoomEvent.Disconnected, onDisconnected);
      room.off(RoomEvent.MediaDevicesError, onMediaDevicesError);
    };
  }, [room, refreshConnectionDetails, mockInterviewId, logError]);

  useEffect(() => {
    if (sessionStarted && room.state === "disconnected" && connectionDetails) {
      Promise.all([
        room.localParticipant.setMicrophoneEnabled(true, undefined, {
          preConnectBuffer: appConfig.isPreConnectBufferEnabled,
        }),
        room.localParticipant.setCameraEnabled(true),
        room.connect(
          connectionDetails.serverUrl,
          connectionDetails.participantToken
        ),
      ]).catch((error) => {
        toastAlert({
          title: "There was an error connecting to the agent",
          description: `${error.name}: ${error.message}`,
        });
      });
    }
    return () => {
      room.disconnect();
    };
  }, [
    room,
    sessionStarted,
    connectionDetails,
    appConfig.isPreConnectBufferEnabled,
    mockInterviewId,
  ]);

  if (!sessionStarted) {
    return (
      <div data-lk-theme="default">
        <PreJoin onSubmit={() => setSessionStarted(true)} />
      </div>
    );
  }

  return (
    <>
      <div data-lk-theme="default">
        <RoomContext.Provider value={room}>
          <RoomAudioRenderer />
          <StartAudio label="Start Audio" />
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
          />
        </RoomContext.Provider>

        <Toaster />
      </div>

      {/* Processing Dialog */}
      <Dialog open={isProcessing} onOpenChange={() => {}}>
        <DialogContent hideClose className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Processing Interview</DialogTitle>
            <DialogDescription>
              Please wait while we process your interview
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Processing...
            </div>
            <div className="flex gap-2 items-center mt-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 dark:border-gray-100" />
              <span className="text-sm">
                Please wait while we process your interview
              </span>
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400 block mt-2">
              You'll receive an email when it's ready
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
