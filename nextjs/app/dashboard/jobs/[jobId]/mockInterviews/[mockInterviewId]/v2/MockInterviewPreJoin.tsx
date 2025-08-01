"use client";

import { LocalUserChoices } from "@livekit/components-react";
import { useState } from "react";
import { MediaDeviceProvider, useMediaDevice } from "@/app/dashboard/jobs/[jobId]/mockInterviews/[mockInterviewId]/MediaDeviceContext";
import InterviewSetup from "@/app/dashboard/jobs/[jobId]/mockInterviews/[mockInterviewId]/InterviewSetupComponent";
import { VoiceOption, VOICE_OPTIONS } from "@/app/types/tts";

interface MockInterviewPreJoinProps {
  onSubmit: (values: LocalUserChoices) => void;
}

export function MockInterviewPreJoin({ onSubmit }: MockInterviewPreJoinProps) {
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>(
    VOICE_OPTIONS[0]
  );

  return (
    <MediaDeviceProvider mediaType="audio-video">
      <MockInterviewPreJoinContent
        onSubmit={onSubmit}
        selectedVoice={selectedVoice}
        setSelectedVoice={setSelectedVoice}
      />
    </MediaDeviceProvider>
  );
}

interface MockInterviewPreJoinContentProps {
  onSubmit: (values: LocalUserChoices) => void;
  selectedVoice: VoiceOption;
  setSelectedVoice: React.Dispatch<React.SetStateAction<VoiceOption>>;
}

function MockInterviewPreJoinContent({
  onSubmit,
  selectedVoice,
  setSelectedVoice,
}: MockInterviewPreJoinContentProps) {
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

  const handleStartInterview = () => {
    onSubmit({
      audioDeviceId: selectedAudio,
      videoDeviceId: selectedVideo,
    } as LocalUserChoices);
  };

  return (
    <InterviewSetup
      videoDevices={videoDevices}
      audioDevices={audioDevices}
      selectedVideo={selectedVideo}
      selectedAudio={selectedAudio}
      stream={stream}
      isRecording={isRecording}
      jobId=""
      selectedVoice={selectedVoice}
      setSelectedVoice={setSelectedVoice}
      startInterviewAction={handleStartInterview}
      onVideoChange={setSelectedVideo}
      onAudioChange={setSelectedAudio}
      onStartTestRecording={startTestRecording}
      onStopTestRecording={stopTestRecording}
    />
  );
}
