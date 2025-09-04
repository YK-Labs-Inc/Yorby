import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
            <div className="flex items-center justify-start space-x-3">
              <Switch
                id="ai-avatar"
                checked={enableAiAvatar}
                onCheckedChange={setEnableAiAvatar}
              />
              <Label htmlFor="ai-avatar" className="text-lg font-medium">
                Enable AI Avatar
              </Label>
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
