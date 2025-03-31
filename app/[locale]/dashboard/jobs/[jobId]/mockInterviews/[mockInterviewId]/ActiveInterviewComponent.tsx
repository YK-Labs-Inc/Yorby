"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { Tables } from "@/utils/supabase/database.types";
import EndInterviewModal from "./EndInterviewModal";
import { useSession } from "@/context/UserContext";
import { useUser } from "@/context/UserContext";
import { CoreMessage } from "ai";
import { ChatUI } from "@/app/components/chat";
import { useTts } from "@/app/context/TtsContext";

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
  const user = useUser();
  const session = useSession();
  const { selectedVoice, stopAudioPlayback } = useTts();

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
    setIsProcessingAIResponse(true);
    const prevMessages = [...messages];
    let updatedMessages: CoreMessage[] =
      prevMessages.length > 0
        ? [
            ...prevMessages,
            {
              role: "user",
              content: message,
            },
          ]
        : [];
    try {
      updatedMessages = [
        ...updatedMessages,
        {
          role: "assistant",
          content: "",
        },
      ];
      setMessages(updatedMessages);
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
        updatedMessages = [
          ...updatedMessages,
          {
            role: "assistant",
            content:
              "Sorry, I couldn't process your message. Could you please send it again?",
          },
        ];
        setMessages(updatedMessages);
        return {
          message: updatedMessages[updatedMessages.length - 1]
            .content as string,
          index: updatedMessages.length - 1,
        };
      }
      const { response: aiResponse } = await chatResponse.json();
      updatedMessages = [
        ...updatedMessages.slice(0, -1),
        {
          role: "assistant",
          content: aiResponse,
        },
      ];
      setMessages(updatedMessages);
      if (messages.length === 0) {
        setFirstQuestionAudioIsInitialized(true);
      }
    } catch (error: any) {
      logError("Error in interview:", { error: error.message });
      updatedMessages = [
        ...updatedMessages,
        {
          role: "assistant",
          content:
            "Sorry, there was an error processing your message. Please try again.",
        },
      ];
      setMessages(updatedMessages);
    } finally {
      setIsProcessingAIResponse(false);
      return {
        message: updatedMessages[updatedMessages.length - 1].content as string,
        index: updatedMessages.length - 1,
      };
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
    videoChunksRef.current = [];
    videoAndAudioRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        videoChunksRef.current.push(e.data);
      }
    };
    videoRecorderRef.current = videoAndAudioRecorder;
    videoRecorderRef.current.start(100);
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
      <div className="h-screen flex flex-col gap-6 max-w-[1080px] mx-auto justify-center items-center p-4 md:p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" />
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 text-center">
            {t("loading.title")}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-center">
            {t("loading.description")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col max-w-[1080px] mx-auto p-4 md:p-6">
      <div className="flex justify-end mb-4">
        <Button
          onClick={() => setShowEndModal(true)}
          variant="destructive"
          className="w-full sm:w-auto"
        >
          {t("endInterview")}
        </Button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row justify-between items-stretch gap-4 md:gap-6 min-h-0 max-h-[calc(100vh-8rem)]">
        {/* Video Feed */}
        <div className="w-full lg:w-1/2">
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
        <div className="w-full lg:w-1/2 h-[calc(100vh-20rem)] lg:h-full">
          <div className="h-full bg-slate-50 dark:bg-slate-900/50 rounded-lg overflow-hidden">
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
        videoBlob={videoChunksRef.current}
        mockInterviewId={mockInterviewId}
        userId={user.id}
        accessToken={session.access_token}
        jobId={jobId}
        endInterview={endInterview}
      />
    </div>
  );
}
