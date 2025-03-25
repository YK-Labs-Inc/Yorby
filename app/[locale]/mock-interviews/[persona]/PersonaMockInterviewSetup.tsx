"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { VoiceOption } from "@/app/types/tts";
import { Turnstile } from "@marsidev/react-turnstile";

interface MediaDevice {
  deviceId: string;
  label: string;
}

interface PersonaMockInterviewSetupProps {
  audioDevices: MediaDevice[];
  selectedAudio: string;
  stream: MediaStream | null;
  isRecording: boolean;
  selectedVoice: VoiceOption;
  onAudioChange: (deviceId: string) => void;
  onStartTestRecording: () => void;
  onStopTestRecording: () => void;
  startInterview: () => void;
}

export default function PersonaMockInterviewSetup({
  audioDevices,
  selectedAudio,
  stream,
  isRecording,
  selectedVoice,
  onAudioChange,
  onStartTestRecording,
  onStopTestRecording,
  startInterview,
}: PersonaMockInterviewSetupProps) {
  const t = useTranslations("mockInterview.setup");
  const [captchaToken, setCaptchaToken] = useState<string>("");

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">
        Mock Interview With {selectedVoice.title}
      </h1>

      <div className="space-y-6 max-w-lg mx-auto">
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

        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Label>{t("voice.label")}</Label>
              <div className="p-2 border rounded-md bg-gray-50">
                {selectedVoice.title}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
          <Turnstile
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
            onSuccess={setCaptchaToken}
          />
          <Button
            size="lg"
            disabled={!stream || !captchaToken}
            onClick={startInterview}
            className="w-full md:w-auto"
          >
            {t("startButton")}
          </Button>
        </div>
      </div>
    </div>
  );
}
