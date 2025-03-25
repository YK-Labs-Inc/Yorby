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
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import Link from "next/link";

interface PersonaActiveInterviewProps {
  stream: MediaStream | null;
}

export default function PersonaActiveInterview({
  stream,
}: PersonaActiveInterviewProps) {
  const t = useTranslations("mockInterview.active");
  const [messages, setMessages] = useState<CoreMessage[]>([]);
  const [isProcessingAIResponse, setIsProcessingAIResponse] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { logError } = useAxiomLogging();
  const [showEndModal, setShowEndModal] = useState(false);
  const { selectedVoice, stopAudioPlayback } = useTts();
  const isInitialized = useRef(false);

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

  const handleSendMessage = async (message: string) => {
    setIsProcessingAIResponse(true);
    stopAudioPlayback();

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
        const errorMessage: CoreMessage = {
          role: "assistant",
          content:
            "Sorry, I couldn't process your message. Could you please send it again?",
        };
        updatedMessages = [...updatedMessages.slice(0, -1), errorMessage];
        setMessages(updatedMessages);
        return {
          message: updatedMessages[updatedMessages.length - 1]
            .content as string,
          index: updatedMessages.length - 1,
        };
      }

      const { aiResponse, interviewHasEnded }: PersonaMockInterviewAIResponse =
        await chatResponse.json();

      const aiMessage: CoreMessage = {
        role: "assistant",
        content: aiResponse,
      };
      updatedMessages = [...updatedMessages.slice(0, -1), aiMessage];
      setMessages(updatedMessages);

      if (interviewHasEnded) {
        setShowEndModal(true);
      }
    } catch (error: any) {
      logError("Error in interview:", { error: error.message });
      const errorMessage: CoreMessage = {
        role: "assistant",
        content:
          "Sorry, there was an error processing your message. Please try again.",
      };
      updatedMessages = [...updatedMessages.slice(0, -1), errorMessage];
      setMessages(updatedMessages);
    } finally {
      setIsProcessingAIResponse(false);
      return {
        message: updatedMessages[updatedMessages.length - 1].content as string,
        index: updatedMessages.length - 1,
      };
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
          {/* Video Feed and CTA Card Column */}
          <div className="flex flex-col gap-4 w-1/2 h-full">
            <div className="flex-1 flex flex-col gap-4">
              <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform scale-x-[-1]"
                />
              </div>

              {showEndModal && (
                <Card className="w-full">
                  <CardHeader>
                    <CardTitle>Interview Complete!</CardTitle>
                    <CardDescription className="pt-4">
                      Great job completing the mock interview! To unlock
                      unlimited personalized mock interviews tailored to
                      specific jobs and your resume, sign up for
                      PerfectInterview today.
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="flex justify-center">
                    <Link href="/sign-up" className="w-full">
                      <Button className="w-full" size="lg">
                        Sign Up Now
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              )}
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
    </>
  );
}
