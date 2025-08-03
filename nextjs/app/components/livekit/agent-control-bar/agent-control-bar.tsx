"use client";

import * as React from "react";
import { Track } from "livekit-client";
import { PhoneOff } from "lucide-react";
import { AppConfig } from "@/app/dashboard/jobs/[jobId]/mockInterviews/[mockInterviewId]/v2/types";
import { cn } from "@/app/dashboard/jobs/[jobId]/mockInterviews/[mockInterviewId]/v2/utils";
import { TrackToggle } from "@/app/components/livekit/track-toggle";
import {
  UseAgentControlBarProps,
  useAgentControlBar,
} from "./hooks/use-agent-control-bar";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { MediaDeviceMenu } from "@livekit/components-react";
export interface AgentControlBarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    UseAgentControlBarProps {
  capabilities: Pick<
    AppConfig,
    "supportsChatInput" | "supportsVideoInput" | "supportsScreenShare"
  >;
  onChatOpenChange?: (open: boolean) => void;
  onSendMessage?: (message: string) => Promise<void>;
  onDisconnect?: () => void;
  onDeviceError?: (error: { source: Track.Source; error: Error }) => void;
}

/**
 * A control bar specifically designed for voice assistant interfaces
 */
export function AgentControlBar({
  controls,
  saveUserChoices = true,
  capabilities,
  className,
  onSendMessage,
  onChatOpenChange,
  onDisconnect,
  onDeviceError,
}: AgentControlBarProps) {
  const t = useTranslations("agentControlBar");
  const {
    visibleControls,
    cameraToggle,
    microphoneToggle,
    screenShareToggle,
    handleDisconnect,
    handleAudioDeviceChange,
    handleVideoDeviceChange,
  } = useAgentControlBar({
    controls,
    saveUserChoices,
  });

  const onLeave = () => {
    handleDisconnect();
    onDisconnect?.();
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
            <div className="lk-button-group">
              <TrackToggle
                source={Track.Source.Microphone}
                pressed={microphoneToggle.enabled}
                disabled={microphoneToggle.pending}
                onPressedChange={microphoneToggle.toggle}
                size="lg"
              >
                {t("microphone")}
              </TrackToggle>
              <MediaDeviceMenu
                kind="audioinput"
                onActiveDeviceChange={(_kind, deviceId) =>
                  handleAudioDeviceChange(deviceId ?? "default")
                }
              />
            </div>
          )}

          {capabilities.supportsVideoInput && visibleControls.camera && (
            <div className="lk-button-group">
              <TrackToggle
                source={Track.Source.Camera}
                pressed={cameraToggle.enabled}
                pending={cameraToggle.pending}
                disabled={cameraToggle.pending}
                onPressedChange={cameraToggle.toggle}
                size="lg"
              >
                {t("camera")}
              </TrackToggle>
              <MediaDeviceMenu
                kind="videoinput"
                onActiveDeviceChange={(_kind, deviceId) =>
                  handleVideoDeviceChange(deviceId ?? "default")
                }
              />
            </div>
          )}

          {capabilities.supportsScreenShare && visibleControls.screenShare && (
            <TrackToggle
              source={Track.Source.ScreenShare}
              pressed={screenShareToggle.enabled}
              disabled={screenShareToggle.pending}
              onPressedChange={screenShareToggle.toggle}
              size="lg"
            />
          )}
        </div>
        {visibleControls.leave && (
          <Button variant="destructive" onClick={onLeave} size="lg">
            <PhoneOff className="h-5 w-5 mr-2" />
            <span>{t("endCall")}</span>
          </Button>
        )}
      </div>
    </div>
  );
}
