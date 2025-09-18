"use client";

import { LocalUserChoices } from "@livekit/components-react";
import { useState } from "react";
import {
  MediaDeviceProvider,
  useMediaDevice,
} from "@/app/dashboard/jobs/[jobId]/mockInterviews/[mockInterviewId]/MediaDeviceContext";
import InterviewSetup from "@/app/dashboard/jobs/[jobId]/mockInterviews/[mockInterviewId]/InterviewSetupComponent";
import { VoiceOption, VOICE_OPTIONS } from "@/app/types/tts";

interface RealInterviewPreJoinProps {
  onSubmit: (values: LocalUserChoices) => void;
  enableAiAvatar?: boolean;
  setEnableAiAvatar?: (enabled: boolean) => void;
  avatarProvider?: "bey" | "simli";
  setAvatarProvider?: (provider: "bey" | "simli") => void;
  shouldUseRealtimeMode?: boolean;
  setShouldUseRealtimeMode?: (mode: boolean) => void;
  enableSimliAvatar?: boolean;
  simliFaceId?: string;
  setSimliFaceId?: (faceId: string) => void;
  requiresTurnstile?: boolean;
}

export function RealInterviewPreJoin({
  onSubmit,
  enableAiAvatar,
  setEnableAiAvatar,
  avatarProvider,
  setAvatarProvider,
  shouldUseRealtimeMode,
  setShouldUseRealtimeMode,
  enableSimliAvatar = false,
  simliFaceId,
  setSimliFaceId,
  requiresTurnstile = false,
}: RealInterviewPreJoinProps) {
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>(
    VOICE_OPTIONS[0]
  );

  return (
    <MediaDeviceProvider mediaType="audio-video">
      <RealInterviewPreJoinContent
        onSubmit={onSubmit}
        selectedVoice={selectedVoice}
        setSelectedVoice={setSelectedVoice}
        enableAiAvatar={enableAiAvatar}
        setEnableAiAvatar={setEnableAiAvatar}
        avatarProvider={avatarProvider}
        setAvatarProvider={setAvatarProvider}
        shouldUseRealtimeMode={shouldUseRealtimeMode}
        setShouldUseRealtimeMode={setShouldUseRealtimeMode}
        enableSimliAvatar={enableSimliAvatar}
        simliFaceId={simliFaceId}
        setSimliFaceId={setSimliFaceId}
        requiresTurnstile={requiresTurnstile}
      />
    </MediaDeviceProvider>
  );
}

interface RealInterviewPreJoinContentProps {
  onSubmit: (values: LocalUserChoices) => void;
  selectedVoice: VoiceOption;
  setSelectedVoice: React.Dispatch<React.SetStateAction<VoiceOption>>;
  enableAiAvatar?: boolean;
  setEnableAiAvatar?: (enabled: boolean) => void;
  avatarProvider?: "bey" | "simli";
  setAvatarProvider?: (provider: "bey" | "simli") => void;
  shouldUseRealtimeMode?: boolean;
  setShouldUseRealtimeMode?: (mode: boolean) => void;
  enableSimliAvatar: boolean;
  simliFaceId?: string;
  setSimliFaceId?: (faceId: string) => void;
  requiresTurnstile?: boolean;
}

function RealInterviewPreJoinContent({
  onSubmit,
  selectedVoice,
  setSelectedVoice,
  enableAiAvatar,
  setEnableAiAvatar,
  avatarProvider,
  setAvatarProvider,
  shouldUseRealtimeMode,
  setShouldUseRealtimeMode,
  enableSimliAvatar,
  simliFaceId,
  setSimliFaceId,
  requiresTurnstile,
}: RealInterviewPreJoinContentProps) {
  const {
    videoDevices,
    audioDevices,
    selectedVideo,
    selectedAudio,
    stream,
    isRecordingTestAudio,
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
      isRecording={isRecordingTestAudio}
      jobId=""
      selectedVoice={selectedVoice}
      setSelectedVoice={setSelectedVoice}
      startInterviewAction={handleStartInterview}
      onVideoChange={setSelectedVideo}
      onAudioChange={setSelectedAudio}
      onStartTestRecording={startTestRecording}
      onStopTestRecording={stopTestRecording}
      enableAiAvatar={enableAiAvatar}
      setEnableAiAvatar={setEnableAiAvatar}
      avatarProvider={avatarProvider}
      setAvatarProvider={setAvatarProvider}
      shouldUseRealtimeMode={shouldUseRealtimeMode}
      setShouldUseRealtimeMode={setShouldUseRealtimeMode}
      enableSimliAvatar={enableSimliAvatar}
      simliFaceId={simliFaceId}
      setSimliFaceId={setSimliFaceId}
      requiresTurnstile={requiresTurnstile}
    />
  );
}
