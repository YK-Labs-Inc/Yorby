"use client";

import * as React from "react";
import { Track } from "livekit-client";
import {
  BarVisualizer,
} from "@livekit/components-react";
import { PhoneOff } from "lucide-react";
import { AppConfig } from "@/app/dashboard/jobs/[jobId]/mockInterviews/[mockInterviewId]/v2/types";
import { cn } from "@/app/dashboard/jobs/[jobId]/mockInterviews/[mockInterviewId]/v2/utils";
import { TrackToggle } from "@/app/components/livekit/track-toggle";
import {
  UseAgentControlBarProps,
  useAgentControlBar,
} from "./hooks/use-agent-control-bar";
import { Button } from "@/components/ui/button";

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
  ...props
}: AgentControlBarProps) {

  const {
    micTrackRef,
    visibleControls,
    cameraToggle,
    microphoneToggle,
    screenShareToggle,
    handleDisconnect,
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
      aria-label="Voice assistant controls"
      className={cn(
        "bg-card border border-border rounded-full px-6 py-3 shadow-sm",
        className
      )}
      {...props}
    >
      <div className="flex flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          {visibleControls.microphone && (
            <TrackToggle
              source={Track.Source.Microphone}
              pressed={microphoneToggle.enabled}
              disabled={microphoneToggle.pending}
              onPressedChange={microphoneToggle.toggle}
              variant={microphoneToggle.enabled ? "default" : "outline"}
              size="lg"
              className="h-12 w-12 rounded-full p-0"
            >
              {microphoneToggle.enabled && (
                <BarVisualizer
                  barCount={3}
                  trackRef={micTrackRef}
                  options={{ minHeight: 4 }}
                  className="absolute inset-0 flex items-center justify-center gap-0.5"
                >
                  <span className="h-4 w-0.5 bg-primary rounded-full" />
                </BarVisualizer>
              )}
            </TrackToggle>
          )}

          {capabilities.supportsVideoInput && visibleControls.camera && (
            <TrackToggle
              source={Track.Source.Camera}
              pressed={cameraToggle.enabled}
              pending={cameraToggle.pending}
              disabled={cameraToggle.pending}
              onPressedChange={cameraToggle.toggle}
              variant={cameraToggle.enabled ? "default" : "outline"}
              size="lg"
              className="h-12 w-12 rounded-full p-0"
            />
          )}

          {capabilities.supportsScreenShare && visibleControls.screenShare && (
            <TrackToggle
              source={Track.Source.ScreenShare}
              pressed={screenShareToggle.enabled}
              disabled={screenShareToggle.pending}
              onPressedChange={screenShareToggle.toggle}
              variant={screenShareToggle.enabled ? "default" : "outline"}
              size="lg"
              className="h-12 px-5 rounded-full"
            />
          )}

        </div>
        {visibleControls.leave && (
          <Button 
            variant="destructive" 
            onClick={onLeave} 
            size="lg"
            className="h-12 px-6 rounded-full font-medium"
          >
            <PhoneOff className="h-5 w-5 mr-2" />
            <span>End Call</span>
          </Button>
        )}
      </div>
    </div>
  );
}
