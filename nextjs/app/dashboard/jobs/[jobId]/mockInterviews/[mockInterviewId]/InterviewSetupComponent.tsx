import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dispatch, SetStateAction, useEffect, useRef } from "react";
import { VoiceOption, VOICE_OPTIONS } from "@/app/types/tts";

interface MediaDevice {
  deviceId: string;
  label: string;
}

interface InterviewSetupProps {
  videoDevices: MediaDevice[];
  audioDevices: MediaDevice[];
  selectedVideo: string;
  selectedAudio: string;
  stream: MediaStream | null;
  isRecording: boolean;
  jobId: string;
  selectedVoice: VoiceOption;
  startInterviewAction: (formData: FormData) => void;
  onVideoChange: (deviceId: string) => void;
  onAudioChange: (deviceId: string) => void;
  setSelectedVoice: Dispatch<SetStateAction<VoiceOption>>;
  onStartTestRecording: () => void;
  onStopTestRecording: () => void;
  enableAiAvatar?: boolean;
  setEnableAiAvatar?: (enabled: boolean) => void;
  avatarProvider?: "bey" | "simli";
  setAvatarProvider?: (provider: "bey" | "simli") => void;
  shouldUseRealtimeMode?: boolean;
  setShouldUseRealtimeMode?: (mode: boolean) => void;
  enableSimliAvatar?: boolean;
  simliFaceId?: string;
  setSimliFaceId?: (faceId: string) => void;
}

export default function InterviewSetup({
  videoDevices,
  audioDevices,
  selectedVideo,
  selectedAudio,
  stream,
  isRecording,
  jobId,
  selectedVoice,
  setSelectedVoice,
  startInterviewAction,
  onVideoChange,
  onAudioChange,
  onStartTestRecording,
  onStopTestRecording,
  enableAiAvatar,
  setEnableAiAvatar,
  avatarProvider,
  setAvatarProvider,
  shouldUseRealtimeMode,
  setShouldUseRealtimeMode,
  enableSimliAvatar = false,
  simliFaceId,
  setSimliFaceId,
}: InterviewSetupProps) {
  const t = useTranslations("mockInterview.setup");
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">{t("title")}</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Label htmlFor="camera">{t("camera.label")}</Label>
              <select
                id="camera"
                value={selectedVideo}
                onChange={(e) => onVideoChange(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                {videoDevices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label}
                  </option>
                ))}
              </select>

              <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform scale-x-[-1]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col justify-between">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <Label htmlFor="microphone">{t("microphone.label")}</Label>
                <select
                  id="microphone"
                  value={selectedAudio}
                  onChange={(e) => onAudioChange(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  {audioDevices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label}
                    </option>
                  ))}
                </select>

                <div className="mt-4 space-y-2">
                  <Button
                    onClick={
                      isRecording ? onStopTestRecording : onStartTestRecording
                    }
                    disabled={!stream}
                    variant="secondary"
                    className={`w-full ${
                      isRecording ? "bg-red-500 hover:bg-red-600" : ""
                    }`}
                  >
                    {isRecording
                      ? t("microphone.stopRecording")
                      : t("microphone.testRecording")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          {enableAiAvatar !== undefined && setEnableAiAvatar && (
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <div className="flex items-center justify-start space-x-3">
                  <Switch
                    id="ai-avatar"
                    checked={enableAiAvatar}
                    onCheckedChange={setEnableAiAvatar}
                  />
                  <Label htmlFor="ai-avatar" className="text-lg font-medium">
                    {t("enableAiAvatar")}
                  </Label>
                </div>
                {enableAiAvatar && (
                  <p className="text-sm text-muted-foreground ml-11">
                    {t("aiAvatarDisclaimer")}
                  </p>
                )}
              </div>
              {enableSimliAvatar && enableAiAvatar && setAvatarProvider && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="avatar-provider"
                      className="text-lg font-medium"
                    >
                      Avatar Provider
                    </Label>
                    <Select
                      value={avatarProvider}
                      onValueChange={(value: "bey" | "simli") =>
                        setAvatarProvider?.(value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select avatar provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bey">Bey AI Avatar</SelectItem>
                        <SelectItem value="simli">Simli AI Avatar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {avatarProvider === "simli" && (
                    <div className="space-y-2 mb-2">
                      <Label
                        htmlFor="simli-face-id"
                        className="text-lg font-medium"
                      >
                        Simli Face ID
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="simli-face-id"
                          value={simliFaceId || ""}
                          onChange={(e) => setSimliFaceId?.(e.target.value)}
                          placeholder="Enter Simli face ID"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            setSimliFaceId?.(
                              "cace3ef7-a4c4-425d-a8cf-a5358eb0c427"
                            )
                          }
                        >
                          Reset to Default
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <div className="flex justify-start">
            <form action={startInterviewAction}>
              <input type="hidden" name="jobId" value={jobId} />
              <Button size="lg" disabled={!stream}>
                {t("startButton")}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
