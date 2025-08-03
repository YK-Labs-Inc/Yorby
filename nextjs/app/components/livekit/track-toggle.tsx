"use client";

import * as React from "react";
import { Track } from "livekit-client";
import { useTrackToggle } from "@livekit/components-react";
import { Mic, MicOff, MonitorUp, Loader2, Video, VideoOff } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";

export type TrackToggleProps = React.ComponentProps<typeof Toggle> & {
  source: Parameters<typeof useTrackToggle>[0]["source"];
  pending?: boolean;
};

function getSourceIcon(
  source: Track.Source,
  enabled: boolean,
  pending = false
) {
  if (pending) {
    return Loader2;
  }

  switch (source) {
    case Track.Source.Microphone:
      return enabled ? Mic : MicOff;
    case Track.Source.Camera:
      return enabled ? Video : VideoOff;
    case Track.Source.ScreenShare:
      return MonitorUp;
    default:
      return React.Fragment;
  }
}

export function TrackToggle({
  source,
  pressed,
  pending,
  className,
  ...props
}: TrackToggleProps) {
  const IconComponent = getSourceIcon(source, pressed ?? false, pending);

  return (
    <Toggle
      pressed={pressed}
      aria-label={`Toggle ${source}`}
      className={cn("rounded-tr-none rounded-br-none", className)}
      {...props}
    >
      <IconComponent className={cn("h-4 w-4", pending && "animate-spin")} />
      {props.children}
    </Toggle>
  );
}
