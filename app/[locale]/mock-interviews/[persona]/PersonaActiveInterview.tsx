"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { CoreMessage, CoreAssistantMessage } from "ai";
import { ChatUI } from "@/app/components/chat";
import { useTts } from "@/app/context/TtsContext";
import { PersonaMockInterviewAIResponse } from "@/app/api/personas/mock-interview/route";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import Link from "next/link";

interface PersonaActiveInterviewProps {
  stream: MediaStream | null;
}

type MessageWithLoading = CoreMessage & {
  isLoading?: boolean;
};

export default function PersonaActiveInterview({
  stream,
}: PersonaActiveInterviewProps) {
  const t = useTranslations("mockInterview.active");
  const [messages, setMessages] = useState<MessageWithLoading[]>([]);
  const [isProcessingAIResponse, setIsProcessingAIResponse] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { logError } = useAxiomLogging();
  const [showEndModal, setShowEndModal] = useState(false);
  const { isTtsEnabled, speakMessage, selectedVoice, stopAudioPlayback } =
    useTts();
  const isInitialized = useRef(false);
  const lastMessageRef = useRef<string | null>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    if (messages.length === 0 && !isInitialized.current) {
      handleSendMessage("begin the interview");
      isInitialized.current = true;
    }
  }, [messages]);

  // Handle TTS playback when messages change
  useEffect(() => {
    const playLastMessage = async () => {
      const lastMessage = messages[messages.length - 1];
      if (
        lastMessage?.role === "assistant" &&
        !lastMessage.isLoading &&
        typeof lastMessage.content === "string" &&
        lastMessage.content !== lastMessageRef.current &&
        isTtsEnabled
      ) {
        lastMessageRef.current = lastMessage.content;
        await speakMessage(lastMessage.content);
      }
    };

    playLastMessage();
  }, [messages, isTtsEnabled, speakMessage]);

  const handleSendMessage = async (message: string) => {
    try {
      setIsProcessingAIResponse(true);
      stopAudioPlayback(); // Stop any current playback before processing new message

      const prevMessages = [...messages];

      // Add user message to chat
      const userMessage: MessageWithLoading = {
        role: "user",
        content: message,
      };

      if (prevMessages.length > 0) {
        setMessages([...prevMessages, userMessage]);
      }

      // Add a temporary message to indicate AI is thinking
      const loadingMessage: MessageWithLoading = {
        role: "assistant",
        content: "",
        isLoading: true,
      };
      setMessages((prev) => [...prev, loadingMessage]);

      // Send message to chat endpoint
      const chatResponse = await fetch("/api/personas/mock-interview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          history: prevMessages,
          speakingStyle: selectedVoice.speakingStyle,
        }),
      });

      if (!chatResponse.ok) {
        logError("Failed to send message", {
          error: chatResponse.statusText,
        });
        const errorMessage: MessageWithLoading = {
          role: "assistant",
          content:
            "Sorry, I couldn't process your message. Could you please send it again?",
        };
        setMessages((prev) => [...prev.slice(0, -1), errorMessage]);
        return;
      }

      const { aiResponse, interviewHasEnded }: PersonaMockInterviewAIResponse =
        await chatResponse.json();

      setMessages((prev) => prev.slice(0, -1));
      const aiMessage: MessageWithLoading = {
        role: "assistant",
        content: aiResponse,
      };
      setMessages((prev) => [...prev, aiMessage]);

      // Check if the interview has ended based on the API response
      if (interviewHasEnded) {
        setShowEndModal(true);
      }
    } catch (error: any) {
      logError("Error in interview:", { error: error.message });
      const errorMessage: MessageWithLoading = {
        role: "assistant",
        content:
          "Sorry, there was an error processing your message. Please try again.",
      };
      setMessages((prev) => [...prev.slice(0, -1), errorMessage]);
    } finally {
      setIsProcessingAIResponse(false);
    }
  };

  const endInterview = () => {
    stopAudioPlayback();
    setShowEndModal(true);
  };

  return (
    <>
      <div className="h-screen flex flex-col max-w-[1080px] mx-auto p-6">
        <div className="flex justify-end mb-4">
          <Button onClick={endInterview} variant="destructive">
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
      </div>

      <Dialog open={showEndModal} onOpenChange={setShowEndModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Interview Complete!</DialogTitle>
            <DialogDescription className="pt-4">
              Great job completing the mock interview! To unlock unlimited
              personalized mock interviews tailored to specific jobs and your
              resume, sign up for PerfectInterview today.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Link href="/sign-up" className="w-full">
              <Button className="w-full" size="lg">
                Sign Up Now
              </Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
