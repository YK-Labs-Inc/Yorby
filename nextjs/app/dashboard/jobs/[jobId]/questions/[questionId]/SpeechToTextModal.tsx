"use client";

import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Video } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "next-intl";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { Separator } from "@/components/ui/separator";
import {
  MediaDeviceProvider,
  useMediaDevice,
} from "../../mockInterviews/[mockInterviewId]/MediaDeviceContext";

interface SpeechToTextModalProps {
  disabled?: boolean;
  onTranscriptionComplete: (
    text: string,
    audioBlob: Blob,
    duration: number
  ) => void;
  videoRecordingCompletedCallback?: (videoChunks: Blob[]) => Promise<void>;
}

const SpeechToTextModalContent = ({
  disabled = false,
  onTranscriptionComplete,
  videoRecordingCompletedCallback,
}: SpeechToTextModalProps) => {
  const t = useTranslations("interviewQuestion");
  const [isAudioRecordingOpen, setIsAudioRecordingOpen] = useState(false);
  const [isVideoRecordingOpen, setIsVideoRecordingOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recordingStartTimeRef = useRef<number>(0);
  const { logError } = useAxiomLogging();
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);

  const {
    audioDevices,
    videoDevices,
    selectedAudio,
    selectedVideo,
    isRecording,
    isProcessing,
    isRecordingTestAudio,
    testRecording,
    isInitialized,
    setSelectedAudio,
    setSelectedVideo,
    startTestRecording,
    stopTestRecording,
    startRecording,
    stopRecording,
    initializeRecording,
    stream,
  } = useMediaDevice();

  useEffect(() => {
    if (isVideoRecordingOpen && video && stream) {
      video.srcObject = stream;
    }
  }, [isVideoRecordingOpen, stream, video]);

  // Initialize devices when modal opens
  const handleAudioRecordingOpenChange = async (open: boolean) => {
    if (open) {
      await initializeRecording();
    }
    setIsAudioRecordingOpen(open);
    setError(null);
  };

  const handleVideoRecordingOpenChange = async (open: boolean) => {
    if (open) {
      await initializeRecording();
    }
    setIsVideoRecordingOpen(open);
    setError(null);
  };

  const closeModals = () => {
    setIsAudioRecordingOpen(false);
    setIsVideoRecordingOpen(false);
    setError(null);
  };

  const audioRecordingCompletedCallback = async (audioChunks: Blob[]) => {
    // Calculate recording duration
    const duration =
      recordingStartTimeRef.current > 0
        ? Math.round((Date.now() - recordingStartTimeRef.current) / 1000)
        : 0;

    const audioBlob = new Blob(audioChunks, {
      type: "audio/webm",
    });

    const formData = new FormData();
    formData.append("audioFileToTranscribe", audioBlob);
    formData.append("source", "practiceQuestion");

    try {
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Transcription failed");
      }

      const { transcription } = (await response.json()) as {
        transcription: string;
      };

      if (transcription) {
        onTranscriptionComplete(transcription, audioBlob, duration);
        closeModals();
      }
    } catch (error: any) {
      logError("Error processing recording:", { error: error.message });
      setError(error.message);
    }
  };

  const handleStartRecording = async ({
    recordVideo = false,
  }: {
    recordVideo?: boolean;
  }) => {
    try {
      recordingStartTimeRef.current = Date.now();

      await startRecording({
        audioRecordingCompletedCallback,
        videoRecordingCompletedCallback: recordVideo
          ? videoRecordingCompletedCallback
          : undefined,
      });
    } catch (error: any) {
      logError("Error starting audio recording:", { error: error.message });
      setError(error.message);
    }
  };

  const handleStopRecording = async () => {
    await stopRecording();
  };

  return (
    <>
      <Dialog
        open={isVideoRecordingOpen}
        onOpenChange={handleVideoRecordingOpenChange}
      >
        <DialogTrigger asChild>
          <Button variant="outline" size="icon" disabled={disabled}>
            <Video className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("speechToText.title")}</DialogTitle>
            <DialogDescription>
              {t("speechToText.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">
                  {t("speechToText.selectCamera")}
                </label>
                <Select value={selectedAudio} onValueChange={setSelectedAudio}>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("speechToText.selectCameraPlaceholder")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {audioDevices.map((device) => (
                      <SelectItem key={device.deviceId} value={device.deviceId}>
                        {device.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">
                  {t("speechToText.selectMicrophone")}
                </label>
                <Select value={selectedVideo} onValueChange={setSelectedVideo}>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t(
                        "speechToText.selectMicrophonePlaceholder"
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {videoDevices.map((device) => (
                      <SelectItem key={device.deviceId} value={device.deviceId}>
                        {device.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Test Recording Section */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("speechToText.testMicrophone")}
              </label>
              <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden">
                <video
                  ref={setVideo}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform scale-x-[-1]"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={
                    isRecordingTestAudio
                      ? stopTestRecording
                      : startTestRecording
                  }
                  disabled={
                    !selectedAudio ||
                    isRecording ||
                    isProcessing ||
                    !isInitialized
                  }
                  variant={isRecordingTestAudio ? "destructive" : "secondary"}
                  className="w-full"
                >
                  {isRecordingTestAudio ? (
                    <>
                      <MicOff className="w-4 h-4 mr-2" />
                      {t("speechToText.stopTestRecording")}
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 mr-2" />
                      {t("speechToText.testRecording")}
                    </>
                  )}
                </Button>
              </div>
            </div>

            <Separator />

            {/* Main Recording Button */}
            <Button
              onClick={() =>
                isRecording
                  ? handleStopRecording()
                  : handleStartRecording({ recordVideo: true })
              }
              disabled={
                !selectedAudio ||
                isProcessing ||
                testRecording !== null ||
                !isInitialized ||
                isRecordingTestAudio
              }
              variant={isRecording ? "destructive" : "default"}
              className="w-full"
            >
              {isRecording ? (
                <>
                  <MicOff className="w-4 h-4 mr-2" />
                  {t("speechToText.stopRecording")}
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 mr-2" />
                  {t("speechToText.startRecording")}
                </>
              )}
            </Button>
            {isProcessing && (
              <div className="text-center text-sm text-muted-foreground">
                {t("speechToText.processing")}
              </div>
            )}
            {error && (
              <div className="text-center text-sm text-red-500">{error}</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={isAudioRecordingOpen}
        onOpenChange={handleAudioRecordingOpenChange}
      >
        <DialogTrigger asChild>
          <Button variant="outline" size="icon" disabled={disabled}>
            <Mic className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("speechToText.title")}</DialogTitle>
            <DialogDescription>
              {t("speechToText.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("speechToText.selectMicrophone")}
              </label>
              <Select value={selectedAudio} onValueChange={setSelectedAudio}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={t("speechToText.selectMicrophonePlaceholder")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {audioDevices.map((device) => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {device.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Test Recording Section */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("speechToText.testMicrophone")}
              </label>
              <div className="flex gap-2">
                <Button
                  onClick={
                    isRecordingTestAudio
                      ? stopTestRecording
                      : startTestRecording
                  }
                  disabled={
                    !selectedAudio ||
                    isRecording ||
                    isProcessing ||
                    !isInitialized
                  }
                  variant={isRecordingTestAudio ? "destructive" : "secondary"}
                  className="w-full"
                >
                  {isRecordingTestAudio ? (
                    <>
                      <MicOff className="w-4 h-4 mr-2" />
                      {t("speechToText.stopTestRecording")}
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 mr-2" />
                      {t("speechToText.testRecording")}
                    </>
                  )}
                </Button>
              </div>
            </div>

            <Separator />

            {/* Main Recording Button */}
            <Button
              onClick={() =>
                isRecording
                  ? handleStopRecording()
                  : handleStartRecording({ recordVideo: false })
              }
              disabled={
                !selectedAudio ||
                isProcessing ||
                testRecording !== null ||
                !isInitialized ||
                isRecordingTestAudio
              }
              variant={isRecording ? "destructive" : "default"}
              className="w-full"
            >
              {isRecording ? (
                <>
                  <MicOff className="w-4 h-4 mr-2" />
                  {t("speechToText.stopRecording")}
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 mr-2" />
                  {t("speechToText.startRecording")}
                </>
              )}
            </Button>
            {isProcessing && (
              <div className="text-center text-sm text-muted-foreground">
                {t("speechToText.processing")}
              </div>
            )}
            {error && (
              <div className="text-center text-sm text-red-500">{error}</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default function SpeechToTextModal(props: SpeechToTextModalProps) {
  return (
    <MediaDeviceProvider mediaType="audio-video">
      <SpeechToTextModalContent {...props} />
    </MediaDeviceProvider>
  );
}
