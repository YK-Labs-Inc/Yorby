"use client";

import * as React from "react";
import { Participant, Track } from "livekit-client";
import { Mic, X, Check } from "lucide-react";
import { AppConfig } from "@/app/dashboard/jobs/[jobId]/mockInterviews/[mockInterviewId]/v2/types";
import { cn } from "@/app/dashboard/jobs/[jobId]/mockInterviews/[mockInterviewId]/v2/utils";
import {
  UseAgentControlBarProps,
  useAgentControlBar,
} from "./hooks/use-agent-control-bar";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import {
  MediaDeviceMenu,
  useIsSpeaking,
  useLocalParticipant,
  useRoomContext,
} from "@livekit/components-react";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import * as Sentry from "@sentry/nextjs";
export interface AgentControlBarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    UseAgentControlBarProps {
  capabilities: Pick<
    AppConfig,
    "supportsChatInput" | "supportsVideoInput" | "supportsScreenShare"
  >;
  realtimeMode: boolean;
}

/**
 * A control bar specifically designed for voice assistant interfaces
 */
export function AgentControlBar({
  controls,
  saveUserChoices = true,
  capabilities,
  className,
  realtimeMode,
}: AgentControlBarProps) {
  const t = useTranslations("agentControlBar");
  const [isPushToTalkActive, setIsPushToTalkActive] = React.useState(false);
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const { logError } = useAxiomLogging();

  const {
    visibleControls,
    cameraToggle,
    microphoneToggle,
    handleAudioDeviceChange,
    handleVideoDeviceChange,
  } = useAgentControlBar({
    controls,
    saveUserChoices,
    realtimeMode,
  });

  const participants = Array.from(room.remoteParticipants.values());
  console.log("participants", participants);

  // TODO: Need to find better way to identify the correct agent participant
  const agentParticipant = participants.find(
    (participant) =>
      !participant.identity.includes("simli") ||
      !participant.identity.includes("bey")
  );

  const handlePushToTalkStart = async () => {
    if (!agentParticipant) {
      logError("No agent participant found");
      Sentry.captureException(new Error("No agent participant found"));
      return;
    }

    setIsPushToTalkActive(true);

    // Enable microphone if not already enabled
    if (!microphoneToggle.enabled) {
      await microphoneToggle.toggle();
    }

    try {
      await localParticipant?.performRpc({
        destinationIdentity: agentParticipant.identity,
        method: "start_turn",
        payload: JSON.stringify({}),
      });
    } catch (error) {
      logError("Failed to start turn:", {
        error: error instanceof Error ? error.message : String(error),
      });
      setIsPushToTalkActive(false);
      // Disable microphone on error
      if (microphoneToggle.enabled) {
        await microphoneToggle.toggle();
      }
    }
  };

  const handlePushToTalkFinish = async () => {
    setIsPushToTalkActive(false);

    // Disable microphone after recording
    if (microphoneToggle.enabled) {
      await microphoneToggle.toggle();
    }

    if (!agentParticipant) {
      logError("No agent participant found");
      Sentry.captureException(new Error("No agent participant found"));
      return;
    }

    try {
      await localParticipant?.performRpc({
        destinationIdentity: agentParticipant.identity,
        method: "end_turn",
        payload: JSON.stringify({}),
      });
    } catch (error) {
      logError("Failed to end turn:", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  return (
    <div
      aria-label={t("ariaLabel")}
      className={cn(
        "bg-card border border-border rounded-lg px-6 py-3 shadow-sm w-full",
        className
      )}
    >
      <div className="flex flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          {visibleControls.microphone && (
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium",
                  microphoneToggle.enabled
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                )}
              >
                {t("microphone")}: {microphoneToggle.enabled ? "On" : "Off"}
              </div>
              <MediaDeviceMenu
                kind="audioinput"
                onActiveDeviceChange={(_kind, deviceId) =>
                  handleAudioDeviceChange(deviceId ?? "default")
                }
              />
            </div>
          )}

          {capabilities.supportsVideoInput && visibleControls.camera && (
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium",
                  cameraToggle.enabled
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                )}
              >
                {t("camera")}: {cameraToggle.enabled ? "On" : "Off"}
              </div>
              <MediaDeviceMenu
                kind="videoinput"
                onActiveDeviceChange={(_kind, deviceId) =>
                  handleVideoDeviceChange(deviceId ?? "default")
                }
              />
            </div>
          )}
        </div>

        {!realtimeMode && (
          <div className="flex items-center gap-2">
            {!isPushToTalkActive ? (
              <Button
                onClick={handlePushToTalkStart}
                size="lg"
                variant="default"
                className="flex items-center gap-2"
              >
                <Mic className="h-4 w-4" />
                {t("pressToSpeak")}
              </Button>
            ) : (
              <Button
                onClick={handlePushToTalkFinish}
                size="lg"
                variant="destructive"
                className="flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                {t("finishRecording")}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
