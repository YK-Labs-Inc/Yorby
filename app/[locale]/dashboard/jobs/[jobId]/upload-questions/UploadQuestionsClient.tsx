"use client";

import { useState } from "react";
import { ChatUI } from "@/app/components/chat";
import { Card } from "@/components/ui/card";
import { H2 } from "@/components/typography";
import { useTranslations } from "next-intl";
import { CoreMessage } from "ai";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { TtsProvider } from "@/app/context/TtsContext";
import { Tables } from "@/utils/supabase/database.types";
import { QuestionsResponse } from "@/app/api/questions/parse/route";

interface Props {
  jobId: string;
  job: Tables<"custom_jobs">;
}

function _UploadQuestionsClient({ jobId, job }: Props) {
  const t = useTranslations("jobPage");
  const [messages, setMessages] = useState<CoreMessage[]>([
    {
      role: "assistant" as const,
      content:
        "Hi! I'll help you upload your interview questions. You can paste your questions here, and I'll help format them properly. Each question should include the question text and optionally any guidelines for answering.",
    },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { logError } = useAxiomLogging();

  const handleSendMessage = async (message: string) => {
    try {
      setIsProcessing(true);

      // Add user message to chat
      const updatedMessages = [
        ...messages,
        { role: "user" as const, content: message },
      ];
      setMessages([...updatedMessages, { role: "assistant", content: "" }]);

      // Call the AI to parse questions
      const response = await fetch("/api/questions/parse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: updatedMessages,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const {
        questions,
        message: aiMessage,
        isReady,
      } = (await response.json()) as QuestionsResponse;
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "assistant", content: aiMessage },
      ]);

      // Only save questions if isReady is true
      if (isReady && questions && questions.length > 0) {
        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
        const saveResponse = await fetch("/api/questions/save", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jobId,
            questions,
          }),
        });

        if (!saveResponse.ok) {
          throw new Error("Failed to save questions");
        }

        // Read the messageKey from the response and add it as an assistant message if present
        const saveData = (await saveResponse.json()) as {
          messageKey: string;
        };
        if (saveData.messageKey) {
          setMessages((prev) => [
            ...prev.slice(0, -1),
            { role: "assistant", content: t(saveData.messageKey) },
          ]);
        }
      }
    } catch (error) {
      logError("Error in question upload:", { error });
      const errorMessage =
        "Sorry, there was an error processing your questions. Please try again.";
      setMessages([
        ...messages,
        { role: "assistant" as const, content: errorMessage },
      ]);
      return {
        message: errorMessage,
        index: messages.length,
      };
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="flex-1 grid grid-cols-1 p-4 md:p-8 overflow-hidden max-w-[2000px] mx-auto w-full h-full">
        <div className="flex flex-col h-full overflow-hidden lg:col-span-2 max-w-3xl mx-auto w-full">
          <div className="flex-none mb-4 space-y-1 px-4">
            <H2 className="text-center">
              {t("uploadQuestionsWithJobTitle", {
                job_title: job.job_title,
              })}
            </H2>
          </div>

          <Card className="flex-1 bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg md:rounded-2xl shadow-lg flex flex-col border-0 transition-all duration-300 overflow-hidden min-h-0">
            <ChatUI
              messages={messages}
              onSendMessage={handleSendMessage}
              isProcessing={isProcessing}
              showTtsControls={false}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function UploadQuestionsClient({ jobId, job }: Props) {
  return (
    <TtsProvider>
      <_UploadQuestionsClient jobId={jobId} job={job} />
    </TtsProvider>
  );
}
