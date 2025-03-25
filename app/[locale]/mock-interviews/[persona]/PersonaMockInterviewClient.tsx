"use client";

import { useState, useEffect, useRef } from "react";
import { VoiceOption } from "@/app/types/tts";
import PersonaMockInterviewSetup from "./PersonaMockInterviewSetup";
import PersonaActiveInterview from "./PersonaActiveInterview";
import { TtsProvider } from "@/app/context/TtsContext";

interface MediaDevice {
  deviceId: string;
  label: string;
}

interface PersonaMockInterviewClientProps {
  selectedVoice: VoiceOption;
}

export function PersonaMockInterviewClientInternal({
  selectedVoice,
}: PersonaMockInterviewClientProps) {
  const [audioDevices, setAudioDevices] = useState<MediaDevice[]>([]);
  const [selectedAudio, setSelectedAudio] = useState<string>("");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [testRecording, setTestRecording] = useState<Blob | null>(null);
  const [startedInterview, setStartedInterview] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    const getMediaDevices = async () => {
      try {
        // Request permission and get initial stream
        const initialStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        setStream(initialStream);

        // Enumerate all media devices
        const devices = await navigator.mediaDevices.enumerateDevices();

        const audioInputs = devices
          .filter((device) => device.kind === "audioinput")
          .map((device) => ({
            deviceId: device.deviceId,
            label:
              device.label || `Microphone ${device.deviceId.slice(0, 5)}...`,
          }));

        setAudioDevices(audioInputs);

        // Set initial selected devices
        if (audioInputs.length) setSelectedAudio(audioInputs[0].deviceId);
      } catch (error) {
        console.error("Error accessing media devices:", error);
      }
    };

    getMediaDevices();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleAudioChange = async (deviceId: string) => {
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } },
      });

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      setStream(newStream);
      setSelectedAudio(deviceId);
    } catch (error) {
      console.error("Error switching audio device:", error);
    }
  };

  const handleStartTestRecording = () => {
    if (!stream) return;

    const audioStream = new MediaStream(stream.getAudioTracks());
    const mediaRecorder = new MediaRecorder(audioStream);
    const chunks: BlobPart[] = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: "audio/webm" });
      setTestRecording(blob);
      setIsRecording(false);
    };

    mediaRecorder.start();
    mediaRecorderRef.current = mediaRecorder;
    setIsRecording(true);
  };

  const handleStopTestRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
    }
  };

  useEffect(() => {
    if (testRecording) {
      playTestRecording();
    }
  }, [testRecording]);

  const playTestRecording = async () => {
    if (!testRecording) return;

    const audioElement = new Audio(URL.createObjectURL(testRecording));

    audioElement.onended = () => {
      setTestRecording(null);
      URL.revokeObjectURL(audioElement.src);
    };

    audioElement.play();
  };

  if (startedInterview) {
    return <PersonaActiveInterview stream={stream} />;
  }

  return (
    <PersonaMockInterviewSetup
      audioDevices={audioDevices}
      selectedAudio={selectedAudio}
      stream={stream}
      isRecording={isRecording}
      selectedVoice={selectedVoice}
      onAudioChange={handleAudioChange}
      onStartTestRecording={handleStartTestRecording}
      onStopTestRecording={handleStopTestRecording}
      startInterview={() => setStartedInterview(true)}
    />
  );
}

export default function PersonaMockInterviewClient({
  selectedVoice,
}: PersonaMockInterviewClientProps) {
  return (
    <TtsProvider initialTtsEnabled={true} initialVoice={selectedVoice}>
      <PersonaMockInterviewClientInternal selectedVoice={selectedVoice} />
    </TtsProvider>
  );
}
