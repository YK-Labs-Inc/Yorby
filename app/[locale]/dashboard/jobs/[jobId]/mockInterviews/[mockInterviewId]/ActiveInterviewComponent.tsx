"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChatMessage } from "@/app/[locale]/api/chat/route";
import { useTranslations } from "next-intl";
import { Mic, MicOff, Video, VideoOff } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { Tables } from "@/utils/supabase/database.types";
import EndInterviewModal from "./EndInterviewModal";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";
import { useSession } from "@/context/UserContext";
import { useUser } from "@/context/UserContext";

interface ActiveInterviewProps {
  mockInterviewId: string;
  stream: MediaStream | null;
  messageHistory: Tables<"mock_interview_messages">[];
  jobId: string;
  selectedAudioOutputId: string;
}

export default function ActiveInterview({
  mockInterviewId,
  stream,
  messageHistory,
  jobId,
  selectedAudioOutputId,
}: ActiveInterviewProps) {
  const t = useTranslations("mockInterview.active");
  const [messages, setMessages] = useState<ChatMessage[]>(
    messageHistory.map((message) => ({
      role: message.role,
      parts: [{ text: message.text }],
    }))
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(
    null
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAnsweringQuestion, setIsAnsweringQuestion] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState("1");
  const [isInitialized, setIsInitialized] = useState(false);
  const [firstQuestionAudioIsInitialized, setFirstQuestionAudioIsInitialized] =
    useState(messageHistory.length > 0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRecorderRef = useRef<MediaRecorder | null>(null);
  const videoRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const videoChunksRef = useRef<Blob[]>([]);
  const { logError } = useAxiomLogging();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showEndModal, setShowEndModal] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const user = useUser();
  const session = useSession();

  useEffect(() => {
    if (isInitialized && stream && messages.length > 0 && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, messages, isInitialized]);

  useEffect(() => {
    if (!isInitialized) {
      setIsInitialized(true);
    }
  }, []);
  // useEffect above and below is a workaround because something is causing
  // component to unmout and causing interviewinitialization to happen twice
  useEffect(() => {
    if (isInitialized && messages.length === 0) {
      sendMessage({ message: "begin the interview", isInitialMessage: true });
    } else {
      setFirstQuestionAudioIsInitialized(true);
    }
  }, [isInitialized]);

  const handlePlaybackSpeedChange = (value: string) => {
    setPlaybackSpeed(value);
    if (audioRef.current) {
      audioRef.current.playbackRate = parseFloat(value);
    }
  };

  const sendMessage = async ({
    message,
    isInitialMessage = false,
  }: {
    message: string;
    isInitialMessage?: boolean;
  }) => {
    try {
      if (!isInitialMessage) {
        setIsAnsweringQuestion(false);
        setMessages((prev) => [
          ...prev,
          { role: "user", parts: [{ text: message }] },
        ]);
      }
      setIsProcessing(true);

      // Send message to chat endpoint
      const chatResponse = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          mockInterviewId,
          history: messages,
          isInitialMessage,
        }),
      });

      if (!chatResponse.ok) {
        throw new Error("Failed to send message");
      }

      const { response: aiResponse } = await chatResponse.json();

      // Add messages to history
      const newAiMessage: ChatMessage = {
        role: "model",
        parts: [{ text: aiResponse }],
      };

      // Convert AI response to speech
      const ttsResponse = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: aiResponse,
        }),
      });

      if (!ttsResponse.ok) {
        throw new Error("Failed to generate speech");
      }

      if (isInitialMessage) {
        setFirstQuestionAudioIsInitialized(true);
      }

      // Create audio blob from response
      const audioBlob = await ttsResponse.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Create and play audio
      if (currentAudio) {
        currentAudio.pause();
        URL.revokeObjectURL(currentAudio.src);
      }

      const audio = new Audio(audioUrl);
      audio.onended = () => setIsPlaying(false);
      audio.playbackRate = parseFloat(playbackSpeed);
      setCurrentAudio(audio);
      audioRef.current = audio;
      setMessages((prev) => [...prev, newAiMessage]);
      await audio.play();
      setIsPlaying(true);
    } catch (error: any) {
      logError("Error in interview:", { error: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const replayLastResponse = () => {
    if (audioRef.current && !isPlaying) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const startAudioRecording = async () => {
    try {
      if (!stream) {
        throw new Error("No media stream available");
      }

      // Stop any currently playing audio
      if (currentAudio && isPlaying) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        setIsPlaying(false);
      }

      const audioStream = new MediaStream(stream.getAudioTracks());
      const audioRecorder = new MediaRecorder(audioStream);
      audioRecorderRef.current = audioRecorder;
      audioChunksRef.current = [];

      audioRecorder.ondataavailable = (e) => {
        console.log("audio chunk", e.data);
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      audioRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const formData = new FormData();
        formData.append("audio", audioBlob);

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
            await sendMessage({ message: transcription });
          }
        } catch (error: any) {
          logError("Error processing recording:", { error: error.message });
        }
      };

      audioRecorder.start();
      setIsAnsweringQuestion(true);
    } catch (error: any) {
      logError("Error starting audio recording:", { error: error.message });
    }
  };

  const stopAudioRecording = () => {
    if (audioRecorderRef.current && isAnsweringQuestion) {
      audioRecorderRef.current.stop();
    }
  };

  const startVideoRecording = () => {
    if (!stream) {
      throw new Error("No media stream available");
    }
    const videoAndAudioStream = new MediaStream([
      ...stream.getVideoTracks(),
      ...stream.getAudioTracks(),
    ]);
    const videoAndAudioRecorder = new MediaRecorder(videoAndAudioStream);
    videoRecorderRef.current = videoAndAudioRecorder;
    videoChunksRef.current = [];
    videoAndAudioRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        videoChunksRef.current.push(e.data);
      }
    };
    videoAndAudioRecorder.onstop = async () => {
      const videoBlob = new Blob(videoChunksRef.current, {
        type: "video/webm",
      });
      setRecordingBlob(videoBlob);
    };
    videoAndAudioRecorder.start();
  };

  const stopVideoRecording = () => {
    if (videoRecorderRef.current) {
      videoRecorderRef.current.stop();
    }
  };

  useEffect(() => {
    if (firstQuestionAudioIsInitialized) {
      startVideoRecording();
    }
  }, [firstQuestionAudioIsInitialized]);

  const endInterview = () => {
    stopVideoRecording();
    stopAudioRecording();
    setShowEndModal(true);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAnsweringQuestion, isProcessing]);

  if (!user || !session) {
    return null;
  }

  if (!firstQuestionAudioIsInitialized) {
    return (
      <div className="flex flex-col gap-6 max-w-[1080px] mx-auto justify-center min-h-screen items-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4  border-t-transparent rounded-full animate-spin" />
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">
            {t("loading.title")}
          </h2>

          <p className="text-gray-500 dark:text-gray-400">
            {t("loading.description")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-[1080px] mx-auto justify-center min-h-screen items-center">
      <div className="flex justify-between items-center gap-6">
        {/* Video Feed */}
        <div className="flex flex-col gap-4 w-1/2">
          <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={
                isAnsweringQuestion ? stopAudioRecording : startAudioRecording
              }
              disabled={isProcessing}
              variant={isAnsweringQuestion ? "destructive" : "default"}
              className="flex-1"
            >
              {isAnsweringQuestion ? (
                <>
                  <MicOff className="w-4 h-4 mr-2" />
                  {t("stopAnswering")}
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 mr-2" />
                  {t("answerQuestion")}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="flex flex-col gap-4 w-1/2">
          <div className="flex-1 overflow-auto space-y-4 min-h-[300px] max-h-[500px] bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    msg.role === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 dark:bg-gray-800"
                  }`}
                >
                  {msg.parts[0].text}
                </div>
              </div>
            ))}
            {isAnsweringQuestion && (
              <div className="flex justify-end">
                <div className="flex gap-1 max-w-[80%] rounded-lg p-3 bg-blue-500/50">
                  <div className="w-2 h-2 bg-white rounded-full animate-[pulse_1s_ease-in-out_0s_infinite]" />
                  <div className="w-2 h-2 bg-white rounded-full animate-[pulse_1s_ease-in-out_0.2s_infinite]" />
                  <div className="w-2 h-2 bg-white rounded-full animate-[pulse_1s_ease-in-out_0.4s_infinite]" />
                </div>
              </div>
            )}
            {isProcessing && !isAnsweringQuestion && (
              <div className="flex justify-start">
                <div className="flex gap-1 max-w-[80%] rounded-lg p-3 bg-gray-200/50 dark:bg-gray-800/50">
                  <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-[pulse_1s_ease-in-out_0s_infinite]" />
                  <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-[pulse_1s_ease-in-out_0.2s_infinite]" />
                  <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-[pulse_1s_ease-in-out_0.4s_infinite]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Controls */}
          <div className="flex gap-2 items-center">
            <Button
              onClick={replayLastResponse}
              disabled={!currentAudio || isPlaying || isProcessing}
              variant="outline"
            >
              {t("replayButton")}
            </Button>
            <Select
              value={playbackSpeed}
              onValueChange={handlePlaybackSpeedChange}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Speed" />
              </SelectTrigger>
              <SelectContent>
                {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((speed) => (
                  <SelectItem key={speed} value={speed.toString()}>
                    {speed}x
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <Button onClick={endInterview} variant="destructive">
        {t("endInterview")}
      </Button>
      {recordingBlob && (
        <EndInterviewModal
          isOpen={showEndModal}
          onClose={() => setShowEndModal(false)}
          videoBlob={recordingBlob}
          mockInterviewId={mockInterviewId}
          userId={user.id}
          accessToken={session.access_token}
          jobId={jobId}
        />
      )}
    </div>
  );
}
