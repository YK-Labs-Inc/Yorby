"use client";

import { ChatUI } from "@/app/components/chat/ChatUI";
import { TtsProvider } from "@/app/context/TtsContext";
import { Card } from "@/components/ui/card";
import { CoreMessage } from "ai";
import { useState, useEffect, useActionState } from "react";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { useUser } from "@/context/UserContext";
import { MediaDeviceProvider } from "../dashboard/jobs/[jobId]/mockInterviews/[mockInterviewId]/MediaDeviceContext";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { markCandidateOnboardingComplete, skipOnboarding } from "./actions";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const OnboardingChat = () => {
  const user = useUser();
  const router = useRouter();
  const t = useTranslations("onboarding");
  const [countdown, setCountdown] = useState<number | null>(null);
  const { logError, logInfo } = useAxiomLogging();

  const [skipState, skipFormAction, isSkipPending] = useActionState(
    skipOnboarding,
    { error: "" }
  );

  const [messages, setMessages] = useState<CoreMessage[]>([
    {
      role: "assistant",
      content: t("chat.welcomeMessage"),
    },
  ]);

  const [isProcessing, setIsProcessing] = useState(false);

  const handleSendMessage = async (message: string, files?: File[]) => {
    setIsProcessing(true);

    const displayMessage =
      message.trim() || (files && files.length > 0)
        ? message.trim() || "*User has uploaded their resume*"
        : message;

    const updatedMessages = [
      ...messages,
      { role: "user" as const, content: displayMessage },
    ];
    setMessages(updatedMessages);

    const formData = new FormData();
    formData.append("messages", JSON.stringify(updatedMessages));

    if (files) {
      files.forEach((file) => {
        formData.append("files", file);
      });
    }

    // Add initial empty assistant message for streaming
    setMessages((prevMessages) => [
      ...prevMessages,
      { role: "assistant", content: "" },
    ]);

    try {
      const response = await fetch("/api/onboarding/chat", {
        method: "POST",
        body: formData,
      });

      if (!response.body) {
        throw new Error("No response body");
      }

      const { message, isComplete } = (await response.json()) as {
        message: string;
        isComplete: boolean;
      };

      // Update the last message with the accumulated response
      setMessages((prevMessages) => {
        const newMessages = [...prevMessages];
        newMessages[newMessages.length - 1] = {
          role: "assistant",
          content: message,
        };
        return newMessages;
      });

      // If onboarding is complete, start countdown and redirect to jobs page
      if (isComplete) {
        logInfo("Onboarding completed, starting countdown to dashboard", {
          userId: user?.id,
        });

        // Mark the candidate onboarding as complete in app_metadata
        markCandidateOnboardingComplete().then((result) => {
          if (!result.success) {
            logError("Failed to mark candidate onboarding as complete", {
              userId: user?.id,
              error: result.error,
            });
          } else {
            logInfo("Successfully marked candidate onboarding as complete", {
              userId: user?.id,
            });
          }
        });

        setCountdown(7);
      }

      return {
        message,
        index: messages.length,
      };
    } catch (error) {
      logError("Error during onboarding chat", {
        error: error instanceof Error ? error.message : String(error),
      });

      setMessages((prevMessages) => [
        ...prevMessages.slice(0, -1),
        {
          role: "assistant",
          content: t("chat.errorMessage"),
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle countdown timer
  useEffect(() => {
    if (countdown === null) return;

    if (countdown === 0) {
      router.push("/dashboard/jobs?newJob=true");
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, router]);

  // Handle skip action errors
  useEffect(() => {
    if (skipState?.error) {
      logError("Failed to skip onboarding", {
        error: skipState.error,
        userId: user?.id,
      });
    }
  }, [skipState?.error, logError, user?.id]);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header with Skip Button */}
      <div className="flex justify-end p-4">
        {countdown !== null ? (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg px-4 py-3 border border-gray-200 dark:border-gray-700"
          >
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                {t("countdownTimer.redirectingText")}
              </p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {countdown}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {t("countdownTimer.secondsText")}
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-col items-end">
            <form action={skipFormAction}>
              <Button
                type="submit"
                variant="outline"
                disabled={isSkipPending}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              >
                {isSkipPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("skipButton.loading")}
                  </>
                ) : (
                  t("skipButton.text")
                )}
              </Button>
            </form>
            {skipState?.error && (
              <p className="text-sm text-red-500 mt-2">{skipState.error}</p>
            )}
          </div>
        )}
      </div>

      {/* Chat Interface */}
      <div className="flex-1 p-4 pt-0 md:p-8 md:pt-0 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="h-full max-w-4xl mx-auto"
        >
          <Card className="h-full shadow-xl border-gray-200 dark:border-gray-700">
            <ChatUI
              messages={messages}
              onSendMessage={handleSendMessage}
              showTtsControls={true}
              showFileSelector={true}
              isProcessing={isProcessing}
            />
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default function OnboardingPage() {
  return (
    <MediaDeviceProvider mediaType="audio">
      <TtsProvider>
        <OnboardingChat />
      </TtsProvider>
    </MediaDeviceProvider>
  );
}
