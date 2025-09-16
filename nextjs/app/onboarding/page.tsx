"use client";

import { ChatUI } from "@/app/components/chat/ChatUI";
import { TtsProvider } from "@/app/context/TtsContext";
import { Card } from "@/components/ui/card";
import { CoreMessage } from "ai";
import { useState, useEffect, useActionState } from "react";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { useUser } from "@/context/UserContext";
import { MediaDeviceProvider } from "../dashboard/jobs/[jobId]/mockInterviews/[mockInterviewId]/MediaDeviceContext";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { markCandidateOnboardingComplete, skipOnboarding } from "./actions";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { usePostHog } from "posthog-js/react";

const TOTAL_STEPS = 2;
const STEPS = ["howDidYouHear", "chat"] as const;

const OnboardingFlow = () => {
  const user = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("onboarding.candidateOnboarding");
  const chatT = useTranslations("onboarding");
  const { logError, logInfo } = useAxiomLogging();
  const posthog = usePostHog();

  // Initialize currentStep from search param if it exists
  const getInitialStep = () => {
    const stepParam = searchParams.get("step");
    if (stepParam) {
      const stepIndex = STEPS.indexOf(stepParam as (typeof STEPS)[number]);
      if (stepIndex !== -1) {
        return stepIndex;
      }
    }
    return 0;
  };

  const [currentStep, setCurrentStep] = useState(getInitialStep);
  const [selectedReferralSource, setSelectedReferralSource] =
    useState<string>("");

  // Chat-related state
  const [countdown, setCountdown] = useState<number | null>(null);
  const [messages, setMessages] = useState<CoreMessage[]>([
    {
      role: "assistant",
      content: chatT("chat.welcomeMessage"),
    },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);

  const [skipState, skipFormAction, isSkipPending] = useActionState(
    skipOnboarding,
    { error: "" }
  );

  const currentStepKey = STEPS[currentStep];

  // Update URL when step changes
  useEffect(() => {
    const currentStepParam = searchParams.get("step");
    const expectedStep = STEPS[currentStep];

    if (currentStepParam !== expectedStep) {
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.set("step", expectedStep);
      router.replace(`/onboarding?${newSearchParams.toString()}`, {
        scroll: false,
      });
    }
  }, [currentStep, router, searchParams]);

  const handleNext = async () => {
    // If we're leaving the survey step, track the event
    if (
      currentStepKey === "howDidYouHear" &&
      selectedReferralSource &&
      posthog
    ) {
      posthog.capture("candidate_referral_source", {
        referral_source: selectedReferralSource,
        step: "candidate_onboarding",
      });
    }

    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(currentStep + 1);
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 200);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 200);
    }
  };

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
          content: chatT("chat.errorMessage"),
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
      router.push("/onboarding/upgrade");
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

  const renderStepContent = () => {
    switch (currentStepKey) {
      case "howDidYouHear":
        const referralSources = [
          { value: "tiktok", label: "TikTok" },
          { value: "instagram", label: "Instagram" },
          { value: "youtube", label: "YouTube" },
          { value: "linkedin", label: "LinkedIn" },
          { value: "twitter", label: "X/Twitter" },
          { value: "word_of_mouth", label: "Word of mouth" },
          { value: "email", label: "Email" },
        ];

        return (
          <div className="space-y-8 max-w-2xl mx-auto">
            {/* Hero Section */}
            <div className="text-center space-y-4">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                  {t("steps.howDidYouHear.title")}
                </h1>
                <p className="text-lg text-gray-600">
                  {t("steps.howDidYouHear.subtitle")}
                </p>
              </motion.div>
            </div>

            {/* Survey Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
            >
              <div className="space-y-3">
                {referralSources.map((source, index) => (
                  <motion.label
                    key={source.value}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:border-blue-200 hover:bg-blue-50/50 ${
                      selectedReferralSource === source.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="referralSource"
                      value={source.value}
                      checked={selectedReferralSource === source.value}
                      onChange={(e) =>
                        setSelectedReferralSource(e.target.value)
                      }
                      className="sr-only"
                    />
                    <div
                      className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                        selectedReferralSource === source.value
                          ? "border-blue-500 bg-blue-500"
                          : "border-gray-300"
                      }`}
                    >
                      {selectedReferralSource === source.value && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                    <span
                      className={`font-medium text-sm ${
                        selectedReferralSource === source.value
                          ? "text-blue-900"
                          : "text-gray-700"
                      }`}
                    >
                      {source.label}
                    </span>
                  </motion.label>
                ))}
              </div>

              {/* Validation message */}
              {!selectedReferralSource && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-gray-500 mt-3 text-center"
                >
                  {t("steps.howDidYouHear.validationMessage")}
                </motion.p>
              )}
            </motion.div>
          </div>
        );

      case "chat":
        return (
          <div className="h-full">
            {/* Header with Skip Button */}
            <div className="flex justify-end mb-4 px-4">
              {countdown !== null ? (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg shadow-lg px-4 py-3 border border-gray-200"
                >
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">
                      {chatT("countdownTimer.redirectingText")}
                    </p>
                    <p className="text-2xl font-bold text-blue-600">
                      {countdown}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {chatT("countdownTimer.secondsText")}
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
                      className="text-gray-600 hover:text-gray-900"
                    >
                      {isSkipPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {chatT("skipButton.loading")}
                        </>
                      ) : (
                        chatT("skipButton.text")
                      )}
                    </Button>
                  </form>
                  {skipState?.error && (
                    <p className="text-sm text-red-500 mt-2">
                      {skipState.error}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Chat Interface - Full Width */}
            <div className="h-[calc(100vh-120px)] px-2">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="h-full w-full"
              >
                <Card className="h-full shadow-xl border-gray-200 w-full">
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

      default:
        return null;
    }
  };

  // For chat step, use full screen layout
  if (currentStepKey === "chat") {
    return (
      <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-b from-gray-50 to-white">
        <div className="flex-1 pt-4 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // For other steps, use standard layout with navigation
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50/50 to-white">
      <div className="container mx-auto px-4 py-6 md:py-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-blue-600" />
              <span className="font-semibold text-gray-900">Yorby</span>
            </div>
          </div>

          {/* Step indicators */}
          <div className="flex items-center gap-2">
            {[...Array(TOTAL_STEPS)].map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep
                    ? "bg-blue-600"
                    : index < currentStep
                      ? "bg-blue-300"
                      : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-16">
          {currentStep > 0 ? (
            <Button
              variant="ghost"
              onClick={handlePrevious}
              className="text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              {t("navigation.previous")}
            </Button>
          ) : (
            <div />
          )}

          {currentStep < TOTAL_STEPS - 1 && (
            <Button
              onClick={handleNext}
              size="lg"
              disabled={
                currentStepKey === "howDidYouHear" && !selectedReferralSource
              }
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-6 text-base font-medium shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30 transition-all duration-300"
            >
              {t("steps.howDidYouHear.cta")}
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default function OnboardingPage() {
  return (
    <MediaDeviceProvider mediaType="audio">
      <TtsProvider>
        <OnboardingFlow />
      </TtsProvider>
    </MediaDeviceProvider>
  );
}
