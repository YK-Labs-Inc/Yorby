"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface VoiceInputProps {
  onTranscription: (transcription: string) => void;
}

interface AudioDevice {
  deviceId: string;
  label: string;
}

export default function VoiceInput({ onTranscription }: VoiceInputProps) {
  const t = useTranslations("resumeBuilder");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [transcription, setTranscription] = useState<string>("");
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([]);
  const [selectedAudio, setSelectedAudio] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Get available audio devices
  useEffect(() => {
    async function getDevices() {
      try {
        // Request microphone permission
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

        const devices = await navigator.mediaDevices.enumerateDevices();

        const audios = devices
          .filter((device) => device.kind === "audioinput")
          .map((device) => ({
            deviceId: device.deviceId,
            label:
              device.label ||
              `Microphone ${device.deviceId.substring(0, 5)}...`,
          }));

        setAudioDevices(audios);
        if (audios.length > 0) {
          const defaultDevice = audios[0].deviceId;
          setSelectedAudio(defaultDevice);
        }
      } catch (error) {
        console.error("Error getting audio devices:", error);
      }
    }

    getDevices();
  }, []);

  // Start recording audio
  const startRecording = async () => {
    try {
      if (!selectedAudio) {
        alert(t("pleaseSelectAMicrophone"));
        return;
      }

      // Initialize media stream with selected audio device
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: selectedAudio,
        },
      });

      streamRef.current = stream;

      // Set up media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      audioChunksRef.current = [];

      // Handle data from microphone
      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Start recording
      mediaRecorder.start(1000);
      setIsRecording(true);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Failed to start recording:", error);
      alert(t("micPermissionError"));
    }
  };

  const stopRecording = async () => {
    try {
      // Stop media recorder
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === "recording"
      ) {
        mediaRecorderRef.current.stop();
      }

      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Stop all tracks in the stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      setIsRecording(false);
      setIsProcessing(true);

      // Process recorded audio for transcription
      if (audioChunksRef.current.length > 0) {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const formData = new FormData();
        formData.append("audio", audioBlob);
        formData.append("source", "resume-builder");

        const response = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          setTranscription(data.transcription);
          onTranscription(data.transcription);
        } else {
          throw new Error(`Transcription failed: ${response.status}`);
        }
      }

      setIsProcessing(false);
      setRecordingTime(0);
    } catch (error) {
      console.error("Failed to stop recording:", error);
      alert(t("recordingError"));
      setIsRecording(false);
      setIsProcessing(false);
      setRecordingTime(0);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" htmlFor="microphone-select">
          {t("selectMicrophone")}
        </label>
        <select
          id="microphone-select"
          value={selectedAudio}
          onChange={(e) => setSelectedAudio(e.target.value)}
          className="w-full p-2 border rounded-md"
          disabled={isRecording}
        >
          {audioDevices.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label}
            </option>
          ))}
        </select>
      </div>

      <Card className="p-4 flex items-center justify-center">
        {isRecording ? (
          <div className="flex flex-col items-center gap-3">
            <Button variant="destructive" onClick={stopRecording}>
              {t("stopRecording")}
            </Button>
          </div>
        ) : isProcessing ? (
          <div className="flex flex-col items-center gap-3">
            <div className="animate-pulse flex space-x-2 items-center">
              <span>{t("processing")}</span>
            </div>
          </div>
        ) : (
          <Button onClick={startRecording}>{t("startRecording")}</Button>
        )}
      </Card>

      {transcription && (
        <div className="mt-4">
          <h3 className="font-medium mb-2">{t("transcription")}</h3>
          <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md max-h-60 overflow-y-auto">
            {transcription}
          </div>
        </div>
      )}

      <div className="text-sm text-gray-500 mt-2">{t("voiceInstructions")}</div>
    </div>
  );
}
