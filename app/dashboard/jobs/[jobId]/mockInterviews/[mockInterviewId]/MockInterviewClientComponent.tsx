"use client";

import { useState } from "react";
import InterviewSetup from "@/app/dashboard/jobs/[jobId]/mockInterviews/[mockInterviewId]/InterviewSetupComponent";
import ActiveInterview from "@/app/dashboard/jobs/[jobId]/mockInterviews/[mockInterviewId]/ActiveInterviewComponent";
import { Tables } from "@/utils/supabase/database.types";
import { TtsProvider, useTts } from "@/app/context/TtsContext";
import { VOICE_OPTIONS } from "@/app/types/tts";
import { MediaDeviceProvider, useMediaDevice } from "./MediaDeviceContext";
import LiveInterviewComponent from "./LiveInterviewComponent";

const MockInterviewComponent = ({
  jobId,
  mockInterviewId,
  messageHistory,
}: {
  jobId: string;
  mockInterviewId: string;
  messageHistory: Tables<"mock_interview_messages">[];
}) => {
  const [hasStartedInterview, setHasStartedInterview] = useState(false);
  const { selectedVoice, setSelectedVoice } = useTts();
  const {
    videoDevices,
    audioDevices,
    selectedVideo,
    selectedAudio,
    stream,
    isRecording,
    setSelectedVideo,
    setSelectedAudio,
    startTestRecording,
    stopTestRecording,
  } = useMediaDevice();

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

  return <LiveInterviewComponent />;
};

export default function MockInterviewClientComponent(props: {
  jobId: string;
  mockInterviewId: string;
  messageHistory: Tables<"mock_interview_messages">[];
}) {
  return (
    <MediaDeviceProvider mediaType="audio-video">
      <TtsProvider initialVoice={VOICE_OPTIONS[0]} initialTtsEnabled={true}>
        <MockInterviewComponent {...props} />
      </TtsProvider>
    </MediaDeviceProvider>
  );
}
