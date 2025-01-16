"use client";

import { use, useEffect, useRef, useState } from "react";
import { startMockInterview } from "../../actions";
import InterviewSetup from "@/app/[locale]/dashboard/jobs/[jobId]/mockInterviews/[mockInterviewId]/InterviewSetupComponent";
import ActiveInterview from "@/app/[locale]/dashboard/jobs/[jobId]/mockInterviews/[mockInterviewId]/ActiveInterviewComponent";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
interface MediaDevice {
  deviceId: string;
  label: string;
}

export default function NewMockInterviewPage({
  params,
}: {
  params: Promise<{ jobId: string; mockInterviewId: string }>;
}) {
  const { jobId, mockInterviewId } = use(params);
  const [videoDevices, setVideoDevices] = useState<MediaDevice[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDevice[]>([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState<MediaDevice[]>(
    []
  );
  const [selectedVideo, setSelectedVideo] = useState<string>("");
  const [selectedAudio, setSelectedAudio] = useState<string>("");
  const [selectedAudioOutput, setSelectedAudioOutput] = useState<string>("");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isTestingOutput, setIsTestingOutput] = useState(false);
  const [hasStartedInterview, setHasStartedInterview] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [testRecording, setTestRecording] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const { logError } = useAxiomLogging();

  useEffect(() => {
    // Get available media devices
    async function getDevices() {
      try {
        // Request permission to access devices
        await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
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
        const audioOutputs = devices
          .filter((device) => device.kind === "audiooutput")
          .map((device) => ({
            deviceId: device.deviceId,
            label: device.label,
          }));

        setVideoDevices(videos);
        setAudioDevices(audios);
        setAudioOutputDevices(audioOutputs);

        if (videos.length > 0) setSelectedVideo(videos[0].deviceId);
        if (audios.length > 0) setSelectedAudio(audios[0].deviceId);
        if (audioOutputs.length > 0)
          setSelectedAudioOutput(audioOutputs[0].deviceId);
      } catch (error: any) {
        logError("Error accessing media devices:", { error: error.message });
      }
    }

    getDevices();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
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

          setStream(newStream);
        } catch (error: any) {
          logError("Error setting up media stream:", { error: error.message });
        }
      }
    }

    setupStream();
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

    if ("setSinkId" in audioElement) {
      try {
        await audioElement.setSinkId(selectedAudioOutput);
      } catch (err: any) {
        logError("Error setting audio output device:", { error: err.message });
      }
    }

    audioElement.onended = () => {
      setTestRecording(null);
      URL.revokeObjectURL(audioElement.src);
    };

    audioElement.play();
  };

  const testAudioOutput = async () => {
    if (isTestingOutput) return;

    setIsTestingOutput(true);
    try {
      const audioElement = new Audio("/assets/testaudio.mp3");

      if ("setSinkId" in audioElement) {
        try {
          await audioElement.setSinkId(selectedAudioOutput);
        } catch (err) {
          logError("Error setting audio output device:", { error: err });
        }
      }

      audioElement.onended = () => {
        setIsTestingOutput(false);
      };

      await audioElement.play();
    } catch (error: any) {
      logError("Error testing audio output:", { error: error.message });
      setIsTestingOutput(false);
    }
  };

  if (!hasStartedInterview) {
    return (
      <InterviewSetup
        videoDevices={videoDevices}
        audioDevices={audioDevices}
        audioOutputDevices={audioOutputDevices}
        selectedVideo={selectedVideo}
        selectedAudio={selectedAudio}
        selectedAudioOutput={selectedAudioOutput}
        stream={stream}
        isTestingOutput={isTestingOutput}
        isRecording={isRecording}
        hasTestRecording={!!testRecording}
        jobId={jobId}
        startInterviewAction={() => setHasStartedInterview(true)}
        onVideoChange={setSelectedVideo}
        onAudioChange={setSelectedAudio}
        onAudioOutputChange={setSelectedAudioOutput}
        onTestAudioOutput={testAudioOutput}
        onStartTestRecording={startTestRecording}
        onStopTestRecording={stopTestRecording}
      />
    );
  }

  return <ActiveInterview mockInterviewId={mockInterviewId} stream={stream} />;
}
