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
  const [videoDevices, setVideoDevices] = useState<MediaDevice[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDevice[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string>("");
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
          video: true,
          audio: true,
        });
        setStream(initialStream);

        // Enumerate all media devices
        const devices = await navigator.mediaDevices.enumerateDevices();

        const videoInputs = devices
          .filter((device) => device.kind === "videoinput")
          .map((device) => ({
            deviceId: device.deviceId,
            label: device.label || `Camera ${device.deviceId.slice(0, 5)}...`,
          }));

        const audioInputs = devices
          .filter((device) => device.kind === "audioinput")
          .map((device) => ({
            deviceId: device.deviceId,
            label:
              device.label || `Microphone ${device.deviceId.slice(0, 5)}...`,
          }));

        setVideoDevices(videoInputs);
        setAudioDevices(audioInputs);

        // Set initial selected devices
        if (videoInputs.length) setSelectedVideo(videoInputs[0].deviceId);
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

  const handleVideoChange = async (deviceId: string) => {
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
        audio: { deviceId: { exact: selectedAudio } },
      });

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      setStream(newStream);
      setSelectedVideo(deviceId);
    } catch (error) {
      console.error("Error switching video device:", error);
    }
  };

  const handleAudioChange = async (deviceId: string) => {
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: selectedVideo } },
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
      videoDevices={videoDevices}
      audioDevices={audioDevices}
      selectedVideo={selectedVideo}
      selectedAudio={selectedAudio}
      stream={stream}
      isRecording={isRecording}
      selectedVoice={selectedVoice}
      onVideoChange={handleVideoChange}
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
