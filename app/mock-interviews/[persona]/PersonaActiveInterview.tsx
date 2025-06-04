"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { CoreMessage } from "ai";
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
import { MediaDeviceProvider } from "@/app/dashboard/jobs/[jobId]/mockInterviews/[mockInterviewId]/MediaDeviceContext";

interface PersonaActiveInterviewProps {
  stream: MediaStream | null;
}

export default function PersonaActiveInterview({
  stream,
}: PersonaActiveInterviewProps) {
  const t = useTranslations("mockInterview.active");
  const [messages, setMessages] = useState<CoreMessage[]>([]);
  const [isProcessingAIResponse, setIsProcessingAIResponse] = useState(false);
  const { logError } = useAxiomLogging();
  const [showEndModal, setShowEndModal] = useState(false);
  const { selectedVoice, stopAudioPlayback } = useTts();
  const isInitialized = useRef(false);

  useEffect(() => {
    if (messages.length === 0 && !isInitialized.current) {
      let initialMessage = t("initialMessage");

      // Customize initial message based on persona's speaking style
      if (selectedVoice?.speakingStyle) {
        if (selectedVoice.voiceId === "dg") {
          initialMessage = `Alright, listen up! This is your mock interview, and I don't sugarcoat anything.

I'm going to grill you with real questions – the kind that separate the warriors from the wannabes.

Remember: 
- No BS answers
- Stay focused
- Show me your mental toughness

You better be ready to bring your A-game. This isn't practice; this is preparation for war.

First question: Who the hell are you and what makes you think you can handle this? Show me what you're made of!`;
        } else if (selectedVoice.voiceId === "lbj") {
          initialMessage = `Yo, what's good? Let's keep it real in this interview.

I'm about to hit you with some questions that'll test what you're made of. This ain't just about what's on your resume – it's about your mindset, your hustle, your drive.

Remember:
- Keep it authentic
- Show me your passion
- Let's see that champion mentality

First up, I wanna hear your story. Break it down for me - who are you and what's your journey been like? Let's get it!`;
        } else if (selectedVoice.voiceId === "cw") {
          initialMessage = `Hi there! I'm so excited to interview you today! 

I know interviews can be a bit nerve-wracking, but don't worry – we're going to have a nice conversation about your experience and skills. I want to get to know the real you!

Remember:
- Just be yourself
- Take your time with answers
- Feel free to ask questions

Let's start with something easy! Could you tell me a little bit about yourself? I'd love to hear your story!`;
        }
      }

      setMessages([
        {
          role: "assistant",
          content: initialMessage,
        },
      ]);
      isInitialized.current = true;
    }
  }, [messages, selectedVoice, t]);

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
    <MediaDeviceProvider>
      <div className="h-[calc(100vh-5rem)] flex flex-col max-w-[1080px] mx-auto p-4 md:p-6">
        <div className="flex justify-end mb-4">
          <Button
            onClick={endInterview}
            variant="destructive"
            className="w-full sm:w-auto"
          >
            {t("endInterview")}
          </Button>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          {showEndModal ? (
            <Card className="w-full mb-4">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">
                  Interview Complete!
                </CardTitle>
                <CardDescription className="pt-4 text-sm md:text-base">
                  Great job completing the mock interview! To unlock unlimited
                  personalized mock interviews tailored to specific jobs and
                  your resume, sign up for PerfectInterview today.
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex justify-center">
                <Link href="/sign-in" className="w-full">
                  <Button className="w-full" size="lg">
                    Sign Up Now
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ) : null}

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
    </MediaDeviceProvider>
  );
}
