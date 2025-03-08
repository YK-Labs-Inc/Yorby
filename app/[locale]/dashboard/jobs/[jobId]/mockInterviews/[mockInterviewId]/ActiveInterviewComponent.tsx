"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { Mic, MicOff } from "lucide-react";
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
import { useSession } from "@/context/UserContext";
import { useUser } from "@/context/UserContext";
import remarkGfm from "remark-gfm";
import ReactMarkdown from "react-markdown";
import { CoreMessage } from "ai";
import { motion, AnimatePresence } from "framer-motion";
import { useVoiceRecording } from "@/app/[locale]/dashboard/resumes/components/useVoiceRecording";
import VoiceRecordingOverlay from "@/app/[locale]/dashboard/resumes/components/VoiceRecordingOverlay";

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
  const [messages, setMessages] = useState<CoreMessage[]>(
    messageHistory.map((message) => ({
      role: message.role === "model" ? "assistant" : "user",
      content: message.text,
    }))
  );
  const [isProcessingAIResponse, setsProcessingAIResponse] = useState(false);
  const [isProcessingUserResponse, setsProcessingUserResponse] =
    useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(
    null
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState("1");
  const [isInitialized, setIsInitialized] = useState(false);
  const [firstQuestionAudioIsInitialized, setFirstQuestionAudioIsInitialized] =
    useState(messageHistory.length > 0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const { logError } = useAxiomLogging();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showEndModal, setShowEndModal] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [textInput, setTextInput] = useState<string>("");
  const user = useUser();
  const session = useSession();

  const {
    startRecording,
    stopRecording,
    cancelRecording,
    isProcessing,
    audioDevices,
    selectedAudio,
    setSelectedAudio,
  } = useVoiceRecording({
    onTranscription: (transcription: string) => {
      if (transcription.trim()) {
        setTextInput(transcription);
        setIsRecording(false);
      }
    },
    t,
  });

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
        setsProcessingUserResponse(false);
        setMessages((prev) => [...prev, { role: "user", content: message }]);
        setTextInput(""); // Clear text input after sending message
      }
      setsProcessingAIResponse(true);

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
        logError("Failed to send message", {
          error: chatResponse.statusText,
        });
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "Sorry, I couldn't process your message. Could you please send it again?",
          },
        ]);
        return;
      }

      const { response: aiResponse } = await chatResponse.json();

      // Add messages to history
      const newAiMessage: CoreMessage = {
        role: "assistant",
        content: aiResponse,
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
      // @ts-ignore - setSinkId exists but TypeScript doesn't know about it
      if (audio.setSinkId && selectedAudioOutputId) {
        try {
          // @ts-ignore
          await audio.setSinkId(selectedAudioOutputId);
        } catch (error: any) {
          logError("Error setting audio output device:", {
            error: error.message,
          });
        }
      }
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
      setsProcessingAIResponse(false);
    }
  };

  const replayLastResponse = () => {
    if (audioRef.current && !isPlaying) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleRecordingToggle = async () => {
    if (isRecording) {
      stopRecording();
      setIsRecording(false);
    } else {
      try {
        await startRecording();
        setIsRecording(true);
      } catch (error) {
        logError("Voice recording toggle error:", { error });
      }
    }
  };

  const startVideoRecording = () => {
    if (!stream) {
      throw new Error("No media stream available");
    }
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
    const videoAndAudioRecorder = new MediaRecorder(stream);
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

  const pauseAudioPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const endInterview = () => {
    stopVideoRecording();
    pauseAudioPlayback();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isRecording, isProcessingAIResponse]);

  const handleTextInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextInput(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (textInput.trim()) {
        sendMessage({ message: textInput });
      }
    }
  };

  if (!user || !session) {
    return null;
  }

  if (!firstQuestionAudioIsInitialized) {
    return (
      <div className="h-screen flex flex-col gap-6 max-w-[1080px] mx-auto justify-center items-center">
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
    <div className="h-screen flex flex-col max-w-[1080px] mx-auto p-6">
      <div className="flex justify-end mb-4">
        <Button onClick={() => setShowEndModal(true)} variant="destructive">
          {t("endInterview")}
        </Button>
      </div>
      <div className="flex-1 flex justify-between items-start gap-6 min-h-0">
        {/* Video Feed */}
        <div className="flex flex-col gap-4 w-1/2 h-full">
          <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform scale-x-[-1]"
            />
          </div>
        </div>

        {/* Chat Interface */}
        <div className="flex flex-col gap-4 w-1/2 h-full">
          <div className="flex-1 overflow-auto space-y-4 min-h-0 bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
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
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content as string}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
            {isProcessingUserResponse && (
              <div className="flex justify-end">
                <div className="flex gap-1 max-w-[80%] rounded-lg p-3 bg-blue-500/50">
                  <div className="w-2 h-2 bg-white rounded-full animate-[pulse_1s_ease-in-out_0s_infinite]" />
                  <div className="w-2 h-2 bg-white rounded-full animate-[pulse_1s_ease-in-out_0.2s_infinite]" />
                  <div className="w-2 h-2 bg-white rounded-full animate-[pulse_1s_ease-in-out_0.4s_infinite]" />
                </div>
              </div>
            )}
            {isProcessingAIResponse && !isProcessingUserResponse && (
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

          {/* Unified Input UI */}
          <div className="flex flex-col gap-4">
            <div className="relative">
              {isProcessing ? (
                <div className="w-full p-6 rounded-lg border dark:bg-gray-800 dark:border-gray-700 bg-white/50 flex items-center justify-center min-h-[120px]">
                  <div className="flex flex-col items-center space-y-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-800 dark:border-gray-700 dark:border-t-white" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {t("transcribing")}
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  <textarea
                    placeholder={t("typeYourResponse")}
                    value={textInput}
                    onChange={handleTextInputChange}
                    onKeyDown={handleKeyDown}
                    className="w-full p-3 pr-24 rounded-lg border resize-none dark:bg-gray-800 dark:border-gray-700"
                    rows={3}
                    disabled={isRecording || isProcessingAIResponse}
                  />
                  <div className="absolute bottom-3 right-3 flex space-x-2">
                    <AnimatePresence>
                      {isRecording ? (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 20 }}
                          className="absolute bottom-full right-0 mb-2 w-[400px]"
                        >
                          <VoiceRecordingOverlay
                            isOpen={true}
                            onClose={() => {
                              cancelRecording();
                              setIsRecording(false);
                            }}
                            onConfirm={() => {
                              stopRecording();
                              setIsRecording(false);
                            }}
                            audioDevices={audioDevices}
                            selectedAudio={selectedAudio}
                            onSelectAudio={(deviceId) =>
                              setSelectedAudio(deviceId)
                            }
                          />
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      className={`h-8 w-8 rounded-full ${
                        isRecording ? "text-red-500" : "text-gray-500"
                      }`}
                      onClick={handleRecordingToggle}
                      disabled={isProcessingAIResponse}
                    >
                      {isRecording ? (
                        <MicOff className="h-4 w-4" />
                      ) : (
                        <Mic className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="h-8"
                      onClick={() => sendMessage({ message: textInput })}
                      disabled={
                        (!textInput.trim() && !isRecording) ||
                        isProcessingAIResponse
                      }
                    >
                      {t("send")}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-2 items-center">
            <Button
              onClick={replayLastResponse}
              disabled={!currentAudio || isPlaying || isProcessingAIResponse}
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
      <EndInterviewModal
        isOpen={showEndModal}
        onClose={() => setShowEndModal(false)}
        videoBlob={recordingBlob}
        mockInterviewId={mockInterviewId}
        userId={user.id}
        accessToken={session.access_token}
        jobId={jobId}
        endInterview={endInterview}
      />
    </div>
  );
}
