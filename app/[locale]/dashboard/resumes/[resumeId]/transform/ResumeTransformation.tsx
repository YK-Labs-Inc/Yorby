"use client";

import { useState } from "react";
import { ChatUI } from "@/app/components/chat/ChatUI";
import { CoreMessage } from "ai";
import { TtsProvider } from "@/app/context/TtsContext";
import { H3 } from "@/components/typography";
import { Link } from "@/i18n/routing";
import { useTransformResume } from "../../agent/useTransformResume";
import { ResumeDataType } from "../../components/ResumeBuilder";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ResumeTransformationProps {
  resume: ResumeDataType;
}

const ResumeTransformationForm = ({ resume }: ResumeTransformationProps) => {
  const [currentResume, setCurrentResume] = useState<ResumeDataType>(resume);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<CoreMessage[]>([
    {
      role: "assistant" as const,
      content:
        "Please provide the job description you'd like to transform your resume for. This will help me tailor your resume to highlight the most relevant experiences and skills for this specific role.",
    },
  ]);
  const {
    sendTransformResume,
    showReturnToResumeButton,
    startAdditionalInformationConversation,
    handleAdditionalInformationConversation,
  } = useTransformResume({
    setMessages,
    currentResume,
    setResume: setCurrentResume,
  });

  const handleSendMessage = async (message: string) => {
    setIsProcessing(true);
    if (startAdditionalInformationConversation) {
      await handleAdditionalInformationConversation(
        [...messages, { role: "user", content: message }],
        setMessages,
        currentResume
      );
    } else {
      await sendTransformResume([
        ...messages,
        { role: "user", content: message },
      ]);
    }
    setIsProcessing(false);
    // Return the last message for TTS
    return {
      message: messages[messages.length - 1].content as string,
      index: messages.length - 1,
    };
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="mx-auto max-w-3xl flex flex-col justify-center min-h-screen overflow-hidden p-4">
        <div className="flex-none space-y-1 px-4 mb-4">
          <H3 className="text-center">
            Let's transform your{" "}
            <Link
              href={`/dashboard/resumes/${resume.id}`}
              className="hover:opacity-70 transition-opacity hover:underline"
            >
              {resume.title}
            </Link>
          </H3>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden px-4 md:px-8 min-h-0">
          <Card className="flex-1 bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg md:rounded-2xl shadow-lg flex flex-col border-0 transition-all duration-300 overflow-hidden">
            <ChatUI
              messages={messages}
              onSendMessage={handleSendMessage}
              isDisabled={isProcessing}
              isProcessing={isProcessing}
              showTtsControls={true}
            />
          </Card>

          {showReturnToResumeButton && (
            <div className="flex-none mt-4">
              <Link href={`/dashboard/resumes/${resume.id}`}>
                <Button className="w-full">Return to resume</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function ResumeTransformation({
  resume,
}: ResumeTransformationProps) {
  return (
    <TtsProvider>
      <ResumeTransformationForm resume={resume} />
    </TtsProvider>
  );
}
