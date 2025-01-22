import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useEffect, useRef } from "react";

interface MediaDevice {
  deviceId: string;
  label: string;
}

interface InterviewSetupProps {
  videoDevices: MediaDevice[];
  audioDevices: MediaDevice[];
  audioOutputDevices: MediaDevice[];
  selectedVideo: string;
  selectedAudio: string;
  selectedAudioOutput: string;
  stream: MediaStream | null;
  isTestingOutput: boolean;
  isRecording: boolean;
  jobId: string;
  startInterviewAction: (formData: FormData) => void;
  onVideoChange: (deviceId: string) => void;
  onAudioChange: (deviceId: string) => void;
  onAudioOutputChange: (deviceId: string) => void;
  onTestAudioOutput: () => void;
  onStartTestRecording: () => void;
  onStopTestRecording: () => void;
}

export default function InterviewSetup({
  videoDevices,
  audioDevices,
  audioOutputDevices,
  selectedVideo,
  selectedAudio,
  selectedAudioOutput,
  stream,
  isTestingOutput,
  isRecording,
  jobId,
  startInterviewAction,
  onVideoChange,
  onAudioChange,
  onAudioOutputChange,
  onTestAudioOutput,
  onStartTestRecording,
  onStopTestRecording,
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

        <div className="space-y-6">
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

          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <Label htmlFor="speakers">{t("speakers.label")}</Label>
                <select
                  id="speakers"
                  value={selectedAudioOutput}
                  onChange={(e) => onAudioOutputChange(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  {audioOutputDevices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label}
                    </option>
                  ))}
                </select>

                <div className="mt-4">
                  <Button
                    onClick={onTestAudioOutput}
                    disabled={isTestingOutput}
                    className="w-full"
                  >
                    {isTestingOutput
                      ? t("speakers.testing")
                      : t("speakers.test")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <form action={startInterviewAction}>
          <input type="hidden" name="jobId" value={jobId} />
          <Button
            size="lg"
            disabled={!stream}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            {t("startButton")}
          </Button>
        </form>
      </div>
    </div>
  );
}
