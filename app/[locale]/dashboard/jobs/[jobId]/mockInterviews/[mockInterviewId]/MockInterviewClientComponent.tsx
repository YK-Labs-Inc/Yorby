"use client";

import { useEffect, useRef, useState } from "react";
import InterviewSetup from "@/app/[locale]/dashboard/jobs/[jobId]/mockInterviews/[mockInterviewId]/InterviewSetupComponent";
import ActiveInterview from "@/app/[locale]/dashboard/jobs/[jobId]/mockInterviews/[mockInterviewId]/ActiveInterviewComponent";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { Tables } from "@/utils/supabase/database.types";
import { TtsProvider, useTts } from "@/app/context/TtsContext";
import { VOICE_OPTIONS } from "@/app/types/tts";

interface MediaDevice {
  deviceId: string;
  label: string;
}

const MockInterviewComponent = ({
  jobId,
  mockInterviewId,
  messageHistory,
}: {
  jobId: string;
  mockInterviewId: string;
  messageHistory: Tables<"mock_interview_messages">[];
}) => {
  const [videoDevices, setVideoDevices] = useState<MediaDevice[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDevice[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string>("");
  const [selectedAudio, setSelectedAudio] = useState<string>("");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasStartedInterview, setHasStartedInterview] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [testRecording, setTestRecording] = useState<Blob | null>(null);
  const { selectedVoice, setSelectedVoice } = useTts();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const { logError } = useAxiomLogging();

  useEffect(() => {
    // Get available media devices
    async function getDevices() {
      try {
        // Request permission to access devices
        const initialStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        // Stop the initial stream since we'll create a new one with selected devices
        initialStream.getTracks().forEach((track) => track.stop());

        const devices = await navigator.mediaDevices.enumerateDevices();

        const videos = devices
          .filter((device) => device.kind === "videoinput")
          .map((device) => ({
            deviceId: device.deviceId,
            label: device.label,
          }));
        const audios = devices
          .filter((device) => device.kind === "audioinput")
          .map((device) => ({
            deviceId: device.deviceId,
            label: device.label,
          }));

        setVideoDevices(videos);
        setAudioDevices(audios);

        if (videos.length > 0) setSelectedVideo(videos[0].deviceId);
        if (audios.length > 0) setSelectedAudio(audios[0].deviceId);
      } catch (error: any) {
        logError("Error accessing media devices:", { error: error.message });
      }
    }

    getDevices();

    // Cleanup function for component unmount
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => {
          track.stop();
        });
        setStream(null);
      }
    };
  }, []);

  useEffect(() => {
    let currentStream: MediaStream | null = null;

    async function setupStream() {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      if (selectedVideo && selectedAudio) {
        try {
          const newStream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: selectedVideo },
            audio: { deviceId: selectedAudio },
          });
          currentStream = newStream;
          setStream(newStream);
        } catch (error: any) {
          logError("Error setting up media stream:", { error: error.message });
        }
      }
    }

    setupStream();

    // Cleanup function to stop all tracks when component unmounts
    // or when selectedVideo/selectedAudio changes
    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach((track) => {
          track.stop();
        });
      }
      if (stream) {
        stream.getTracks().forEach((track) => {
          track.stop();
        });
        setStream(null);
      }
    };
  }, [selectedVideo, selectedAudio]);

  const startTestRecording = () => {
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

  const stopTestRecording = () => {
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

  if (!hasStartedInterview) {
    return (
      <InterviewSetup
        videoDevices={videoDevices}
        audioDevices={audioDevices}
        selectedVideo={selectedVideo}
        selectedAudio={selectedAudio}
        stream={stream}
        isRecording={isRecording}
        jobId={jobId}
        selectedVoice={selectedVoice}
        setSelectedVoice={setSelectedVoice}
        startInterviewAction={() => setHasStartedInterview(true)}
        onVideoChange={setSelectedVideo}
        onAudioChange={setSelectedAudio}
        onStartTestRecording={startTestRecording}
        onStopTestRecording={stopTestRecording}
      />
    );
  }

  return (
    <ActiveInterview
      mockInterviewId={mockInterviewId}
      messageHistory={messageHistory}
      jobId={jobId}
      stream={stream}
    />
  );
};

export default function MockInterviewClientComponent(props: {
  jobId: string;
  mockInterviewId: string;
  messageHistory: Tables<"mock_interview_messages">[];
}) {
  return (
    <TtsProvider initialVoice={VOICE_OPTIONS[0]} initialTtsEnabled={true}>
      <MockInterviewComponent {...props} />
    </TtsProvider>
  );
}
