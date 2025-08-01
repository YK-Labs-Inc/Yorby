"use client";

import * as React from "react";
import {
  LocalAudioTrack,
  LocalVideoTrack,
  RoomEvent,
  Track,
} from "livekit-client";
import { PhoneOff, Check, ChevronDown } from "lucide-react";
import { AppConfig } from "@/app/dashboard/jobs/[jobId]/mockInterviews/[mockInterviewId]/v2/types";
import { cn } from "@/app/dashboard/jobs/[jobId]/mockInterviews/[mockInterviewId]/v2/utils";
import { TrackToggle } from "@/app/components/livekit/track-toggle";
import {
  UseAgentControlBarProps,
  useAgentControlBar,
} from "./hooks/use-agent-control-bar";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import {
  useMaybeRoomContext,
  useMediaDeviceSelect,
} from "@livekit/components-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

/** @public */
export interface MediaDeviceMenuProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  kind?: MediaDeviceKind;
  initialSelection?: string;
  onActiveDeviceChange?: (kind: MediaDeviceKind, deviceId: string) => void;
  tracks?: Partial<
    Record<MediaDeviceKind, LocalAudioTrack | LocalVideoTrack | undefined>
  >;
  /**
   * this will call getUserMedia if the permissions are not yet given to enumerate the devices with device labels.
   * in some browsers multiple calls to getUserMedia result in multiple permission prompts.
   * It's generally advised only flip this to true, once a (preview) track has been acquired successfully with the
   * appropriate permissions.
   *
   * @see {@link PreJoin}
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/enumerateDevices | MDN enumerateDevices}
   */
  requestPermissions?: boolean;
}

/**
 * The `MediaDeviceMenu` component is a button that opens a menu that lists
 * all media devices and allows the user to select them.
 *
 * @remarks
 * This component is implemented with the `MediaDeviceSelect` LiveKit components.
 *
 * @example
 * ```tsx
 * <LiveKitRoom>
 *   <MediaDeviceMenu />
 * </LiveKitRoom>
 * ```
 * @public
 */
export function MediaDeviceMenu({
  kind,
  initialSelection,
  onActiveDeviceChange,
  tracks,
  requestPermissions = false,
  ...props
}: MediaDeviceMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [needPermissions, setNeedPermissions] =
    React.useState(requestPermissions);

  const handleActiveDeviceChange = (
    kind: MediaDeviceKind,
    deviceId: string
  ) => {
    setIsOpen(false);
    onActiveDeviceChange?.(kind, deviceId);
  };

  React.useLayoutEffect(() => {
    if (isOpen) {
      setNeedPermissions(true);
    }
  }, [isOpen]);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className="flex h-7 w-7 items-center justify-center rounded-full bg-primary hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
          aria-pressed={isOpen}
          {...props}
        >
          <ChevronDown className="h-3.5 w-3.5 text-primary-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="min-w-[200px] bg-primary text-primary-foreground"
        align="start"
      >
        {kind ? (
          <MediaDeviceSelect
            initialSelection={initialSelection}
            onActiveDeviceChange={(deviceId) =>
              handleActiveDeviceChange(kind, deviceId)
            }
            kind={kind}
            track={tracks?.[kind]}
            requestPermissions={needPermissions}
          />
        ) : (
          <>
            <DropdownMenuLabel className="text-primary-foreground/70 text-xs">
              Audio inputs
            </DropdownMenuLabel>
            <MediaDeviceSelect
              kind="audioinput"
              onActiveDeviceChange={(deviceId) =>
                handleActiveDeviceChange("audioinput", deviceId)
              }
              track={tracks?.audioinput}
              requestPermissions={needPermissions}
            />
            <DropdownMenuSeparator className="bg-primary-foreground/20" />
            <DropdownMenuLabel className="text-primary-foreground/70 text-xs">
              Video inputs
            </DropdownMenuLabel>
            <MediaDeviceSelect
              kind="videoinput"
              onActiveDeviceChange={(deviceId) =>
                handleActiveDeviceChange("videoinput", deviceId)
              }
              track={tracks?.videoinput}
              requestPermissions={needPermissions}
            />
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** @public */
export interface MediaDeviceSelectProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onError"> {
  kind: MediaDeviceKind;
  onActiveDeviceChange?: (deviceId: string) => void;
  onDeviceListChange?: (devices: MediaDeviceInfo[]) => void;
  onDeviceSelectError?: (e: Error) => void;
  initialSelection?: string;
  /** will force the browser to only return the specified device
   * will call `onDeviceSelectError` with the error in case this fails
   */
  exactMatch?: boolean;
  track?: LocalAudioTrack | LocalVideoTrack;
  /**
   * this will call getUserMedia if the permissions are not yet given to enumerate the devices with device labels.
   * in some browsers multiple calls to getUserMedia result in multiple permission prompts.
   * It's generally advised only flip this to true, once a (preview) track has been acquired successfully with the
   * appropriate permissions.
   *
   * @see {@link MediaDeviceMenu}
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/enumerateDevices | MDN enumerateDevices}
   */
  requestPermissions?: boolean;
  onError?: (e: Error) => void;
}

/**
 * The `MediaDeviceSelect` list all media devices of one kind.
 * Clicking on one of the listed devices make it the active media device.
 *
 * @example
 * ```tsx
 * <LiveKitRoom>
 *   <MediaDeviceSelect kind='audioinput' />
 * </LiveKitRoom>
 * ```
 * @public
 */
export const MediaDeviceSelect = React.forwardRef<
  HTMLDivElement,
  MediaDeviceSelectProps
>(function MediaDeviceSelect(
  {
    kind,
    initialSelection,
    onActiveDeviceChange,
    onDeviceListChange,
    onDeviceSelectError,
    exactMatch,
    track,
    requestPermissions,
    onError,
    ...props
  }: MediaDeviceSelectProps,
  ref
) {
  const room = useMaybeRoomContext();
  const previousActiveDeviceId = React.useRef<string>("default");
  const handleError = React.useCallback(
    (e: Error) => {
      if (room) {
        // awkwardly emit the event from outside of the room, as we don't have other means to raise a MediaDeviceError
        room.emit(RoomEvent.MediaDevicesError, e);
      }
      onError?.(e);
    },
    [room, onError]
  );
  const { devices, activeDeviceId, setActiveMediaDevice } =
    useMediaDeviceSelect({
      kind,
      room,
      track,
      requestPermissions,
      onError: handleError,
    });
  React.useEffect(() => {
    if (initialSelection !== undefined) {
      setActiveMediaDevice(initialSelection);
    }
  }, [setActiveMediaDevice]);

  React.useEffect(() => {
    if (typeof onDeviceListChange === "function") {
      onDeviceListChange(devices);
    }
  }, [onDeviceListChange, devices]);

  React.useEffect(() => {
    if (activeDeviceId !== previousActiveDeviceId.current) {
      onActiveDeviceChange?.(activeDeviceId);
    }
    previousActiveDeviceId.current = activeDeviceId;
  }, [activeDeviceId]);

  const handleActiveDeviceChange = async (deviceId: string) => {
    try {
      await setActiveMediaDevice(deviceId, { exact: exactMatch ?? true });
    } catch (e) {
      if (e instanceof Error) {
        onDeviceSelectError?.(e);
      } else {
        throw e;
      }
    }
  };

  const hasDefault = !!devices.find((info) =>
    info.label.toLowerCase().startsWith("default")
  );

  function isActive(deviceId: string, activeDeviceId: string, index: number) {
    return (
      deviceId === activeDeviceId ||
      (!hasDefault && index === 0 && activeDeviceId === "default")
    );
  }

  return (
    <div ref={ref} {...props}>
      {devices.map((device, index) => {
        const active = isActive(device.deviceId, activeDeviceId, index);
        return (
          <DropdownMenuItem
            key={device.deviceId}
            id={device.deviceId}
            className="relative flex items-center pl-8 pr-3 py-2.5 cursor-pointer hover:bg-primary-foreground/10 text-primary-foreground focus:bg-primary-foreground/10 focus:text-primary-foreground"
            onClick={() => handleActiveDeviceChange(device.deviceId)}
          >
            {active && (
              <Check className="absolute left-2 h-4 w-4 text-primary-foreground" />
            )}
            <span className="text-sm truncate">{device.label}</span>
          </DropdownMenuItem>
        );
      })}
    </div>
  );
});
