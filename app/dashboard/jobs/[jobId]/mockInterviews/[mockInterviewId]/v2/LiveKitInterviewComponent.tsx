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
import useConnectionDetails from "./hooks/useConnectionDetails";
import { useParams } from "next/navigation";
import "@livekit/components-styles";
import "./livekit-light-theme.css";

const MotionSessionView = motion.create(SessionView);

interface AppProps {
  appConfig: AppConfig;
}

export function LiveKitInterviewComponent({ appConfig }: AppProps) {
  const room = useMemo(() => new Room(), []);
  const [sessionStarted, setSessionStarted] = useState(false);
  const { mockInterviewId } = useParams<{ mockInterviewId: string }>();
  const { connectionDetails, refreshConnectionDetails } = useConnectionDetails({
    mockInterviewId,
  });

  useEffect(() => {
    const onDisconnected = () => {
      setSessionStarted(false);
      refreshConnectionDetails();
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
  }, [room, refreshConnectionDetails]);

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
  ]);

  if (!sessionStarted) {
    return (
      <div data-lk-theme="default">
        <PreJoin onSubmit={() => setSessionStarted(true)} />
      </div>
    );
  }

  return (
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
  );
}
