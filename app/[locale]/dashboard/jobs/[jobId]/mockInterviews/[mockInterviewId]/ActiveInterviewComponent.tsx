"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { Tables } from "@/utils/supabase/database.types";
import EndInterviewModal from "./EndInterviewModal";
import { useSession } from "@/context/UserContext";
import { useUser } from "@/context/UserContext";
import { CoreMessage, CoreAssistantMessage } from "ai";
import { ChatUI } from "@/app/components/chat";
import { TtsProvider, useTts, VoiceOption } from "@/app/context/TtsContext";

interface ActiveInterviewProps {
  mockInterviewId: string;
  stream: MediaStream | null;
  messageHistory: Tables<"mock_interview_messages">[];
  jobId: string;
}

export default function ActiveInterviewComponent({
  mockInterviewId,
  stream,
  messageHistory,
  jobId,
}: ActiveInterviewProps) {
  const t = useTranslations("mockInterview.active");
  const [messages, setMessages] = useState<CoreMessage[]>(
    messageHistory.map((message) => ({
      role: message.role === "model" ? "assistant" : "user",
      content: message.text,
    }))
  );
  const [isProcessingAIResponse, setIsProcessingAIResponse] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [firstQuestionAudioIsInitialized, setFirstQuestionAudioIsInitialized] =
    useState(messageHistory.length > 0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const { logError } = useAxiomLogging();
  const [showEndModal, setShowEndModal] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const user = useUser();
  const session = useSession();
  const { isTtsEnabled, selectedVoice, speakMessage, stopAudioPlayback } =
    useTts();

  useEffect(() => {
    if (!isInitialized) {
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (isInitialized && messages.length === 0) {
      handleSendMessage("begin the interview");
    } else {
      setFirstQuestionAudioIsInitialized(true);
    }
  }, [isInitialized]);

  const handleSendMessage = async (message: string) => {
    try {
      setIsProcessingAIResponse(true);
      const prevMessages = [...messages];

      // Add user message to chat
      const updatedMessages: CoreMessage[] = [
        ...prevMessages,
        {
          role: "user",
          content: message,
        },
      ];

      if (prevMessages.length > 0) {
        setMessages(updatedMessages);
      }

      // Add a temporary message to indicate AI is thinking
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "",
          isLoading: true,
        },
      ]);

      // Send message to chat endpoint
      const chatResponse = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          mockInterviewId,
          history: prevMessages,
          isInitialMessage: messages.length === 0,
          speakingStyle: selectedVoice.speakingStyle,
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

      if (isTtsEnabled) {
        await speakMessage(aiResponse);
      }

      setMessages((prev) => prev.slice(0, -1));
      const aiMessage: CoreAssistantMessage = {
        role: "assistant",
        content: aiResponse,
      };
      setMessages((prev) => [...prev, aiMessage]);

      if (messages.length === 0) {
        setFirstQuestionAudioIsInitialized(true);
      }
    } catch (error: any) {
      logError("Error in interview:", { error: error.message });
      setMessages((prev) => prev.slice(0, -1));
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, there was an error processing your message. Please try again.",
        },
      ]);
    } finally {
      setIsProcessingAIResponse(false);
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

  const endInterview = () => {
    stopVideoRecording();
    stopAudioPlayback();
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
          <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 rounded-lg overflow-hidden">
            <ChatUI
              messages={messages}
              onSendMessage={handleSendMessage}
              isProcessing={isProcessingAIResponse}
              showTtsControls={true}
              className="h-full"
            />
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
