"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Play } from "lucide-react";
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

interface MediaDevice {
  deviceId: string;
  label: string;
}

interface SpeechToTextModalProps {
  disabled?: boolean;
  onTranscriptionComplete: (
    text: string,
    audioBlob: Blob,
    duration: number
  ) => void;
}

export default function SpeechToTextModal({
  disabled = false,
  onTranscriptionComplete,
}: SpeechToTextModalProps) {
  const t = useTranslations("interviewQuestion");
  const [isOpen, setIsOpen] = useState(false);
  const [audioDevices, setAudioDevices] = useState<MediaDevice[]>([]);
  const [selectedAudio, setSelectedAudio] = useState<string>("");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTestRecording, setIsTestRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number>(0);
  const { logError } = useAxiomLogging();

  // Get available audio devices
  const getDevices = async () => {
    try {
      // Request permission to access devices
      const initialStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      // Stop the initial stream since we'll create a new one with selected devices
      initialStream.getTracks().forEach((track) => track.stop());

      const devices = await navigator.mediaDevices.enumerateDevices();
      const audios = devices
        .filter((device) => device.kind === "audioinput")
        .map((device) => ({
          deviceId: device.deviceId,
          label: device.label,
        }));

      setAudioDevices(audios);
      if (audios.length > 0) {
        const defaultDevice = audios[0].deviceId;
        setSelectedAudio(defaultDevice);
        // Set up stream with the default device
        const newStream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: defaultDevice },
        });
        setStream(newStream);
      }
    } catch (error: any) {
      logError("Error accessing media devices:", { error: error.message });
    }
  };

  // Setup stream when audio device changes
  const setupStream = async () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    if (selectedAudio) {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: selectedAudio },
        });
        setStream(newStream);
      } catch (error: any) {
        logError("Error setting up media stream:", { error: error.message });
      }
    }
  };

  const startTestRecording = async () => {
    try {
      if (!stream) {
        throw new Error("No media stream available");
      }

      const audioStream = new MediaStream(stream.getAudioTracks());
      const audioRecorder = new MediaRecorder(audioStream, {
        mimeType: "audio/webm;codecs=opus",
      });
      mediaRecorderRef.current = audioRecorder;
      audioChunksRef.current = [];

      audioRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      audioRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        // Automatically play the recording
        const audioUrl = URL.createObjectURL(audioBlob);
        const audioElement = new Audio(audioUrl);
        audioElement.play();
        audioElement.onended = () => {
          URL.revokeObjectURL(audioUrl);
        };
      };

      audioRecorder.start(1000);
      setIsTestRecording(true);
    } catch (error: any) {
      logError("Error starting test recording:", { error: error.message });
    }
  };

  const stopTestRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
      setIsTestRecording(false);
    }
  };

  const startRecording = async () => {
    try {
      if (!stream) {
        throw new Error("No media stream available");
      }

      const audioStream = new MediaStream(stream.getAudioTracks());
      const audioRecorder = new MediaRecorder(audioStream, {
        mimeType: "audio/webm;codecs=opus",
      });
      mediaRecorderRef.current = audioRecorder;
      audioChunksRef.current = [];

      audioRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      audioRecorder.onstop = async () => {
        setIsProcessing(true);

        // Calculate recording duration
        const duration =
          recordingStartTimeRef.current > 0
            ? Math.round((Date.now() - recordingStartTimeRef.current) / 1000)
            : 0;

        const audioBlob = new Blob(audioChunksRef.current, {
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
            setIsOpen(false);
          }
        } catch (error: any) {
          logError("Error processing recording:", { error: error.message });
          setError(error.message);
        } finally {
          setIsProcessing(false);
        }
      };

      audioRecorder.start(1000); // Start recording with 1 second timeslices
      recordingStartTimeRef.current = Date.now(); // Track start time
      setIsRecording(true);
    } catch (error: any) {
      logError("Error starting audio recording:", { error: error.message });
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Initialize devices when modal opens
  const handleOpenChange = (open: boolean) => {
    if (open) {
      getDevices();
    } else {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
      setIsRecording(false);
      setIsProcessing(false);
      recordingStartTimeRef.current = 0;
    }
    setIsOpen(open);
  };

  // Setup stream when audio device changes
  const handleAudioChange = (deviceId: string) => {
    setSelectedAudio(deviceId);
    setupStream();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" disabled={disabled}>
          <Mic className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("speechToText.title")}</DialogTitle>
          <DialogDescription>{t("speechToText.description")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("speechToText.selectMicrophone")}
            </label>
            <Select value={selectedAudio} onValueChange={handleAudioChange}>
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
                  isTestRecording ? stopTestRecording : startTestRecording
                }
                disabled={!selectedAudio || isRecording || isProcessing}
                variant={isTestRecording ? "destructive" : "secondary"}
                className="w-full"
              >
                {isTestRecording ? (
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
            onClick={isRecording ? stopRecording : startRecording}
            disabled={!selectedAudio || isProcessing || isTestRecording}
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
            <div className=" text-center text-sm text-red-500">{error}</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
