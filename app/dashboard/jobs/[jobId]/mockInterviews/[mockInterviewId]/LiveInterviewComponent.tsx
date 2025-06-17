"use client";

import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useGeminiLive } from "./useGeminiLive";
import { Button } from "@/components/ui/button";
import { PhoneOff, Mic, Square, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { getGeminiEphemeralToken } from "./actions";

export default function LiveInterviewComponent() {
  const [token, setToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [isLoadingToken, setIsLoadingToken] = useState(true);

  // Fetch token on mount
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const result = await getGeminiEphemeralToken();
        if (result.token) {
          setToken(result.token);
        }
        if (result.error) {
          setTokenError(result.error);
        }
      } catch (error) {
        setTokenError("Failed to get authentication token");
      } finally {
        setIsLoadingToken(false);
      }
    };
    fetchToken();
  }, []);

  const {
    isRecording,
    status,
    error,
    inputNode,
    outputNode,
    startRecording,
    stopRecording,
    reset,
  } = useGeminiLive({
    token,
  });
  console.log("token:");

  const [hasStartedInitialRecording, setHasStartedInitialRecording] =
    useState(false);

  // Auto-start recording when component mounts and session is connected
  useEffect(() => {
    if (
      status === "Connected to Gemini Live" &&
      !hasStartedInitialRecording &&
      !isRecording
    ) {
      setHasStartedInitialRecording(true);
      startRecording();
    }
  }, [status, hasStartedInitialRecording, isRecording, startRecording]);

  // Mock states to match ActiveInterviewComponent UI
  const isAISpeaking = status === "Connected to Gemini Live" && !isRecording;
  const isProcessingMedia = false;
  const currentAIMessage = tokenError || error || status;
  const showTranscript = true;

  // Show loading state while fetching token
  if (isLoadingToken) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-muted-foreground">
            Initializing interview session...
          </p>
        </div>
      </div>
    );
  }

  // Show error if token fetch failed
  if (tokenError) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">
            Failed to initialize interview session
          </p>
          <p className="text-muted-foreground">{tokenError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Video feeds row - both centered at same height */}
        <div className="flex-1 flex items-center justify-center p-8 gap-8">
          {/* AI Interviewer video */}
          <div
            className={`relative w-full max-w-xl aspect-video bg-card rounded-lg overflow-hidden shadow-xl border-2 flex items-center justify-center transition-all duration-300 ${
              isAISpeaking
                ? "border-primary shadow-primary/20 shadow-2xl"
                : "border-border"
            }`}
          >
            {/* Speaking animation overlay */}
            {isAISpeaking && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 rounded-lg border-2 border-primary animate-ping opacity-75" />
                <div className="absolute inset-0 rounded-lg border-2 border-primary animate-pulse" />
              </div>
            )}
            <div className="text-center p-8">
              {/* AI Avatar */}
              <div
                className={`w-32 h-32 mx-auto bg-primary rounded-full flex items-center justify-center shadow-xl transition-transform duration-300 ${
                  isAISpeaking ? "scale-110" : "scale-100"
                }`}
              >
                <div className="text-primary-foreground text-5xl font-bold">
                  AI
                </div>
              </div>
              <p className="mt-4 text-sm font-medium text-foreground">
                AI Interviewer
              </p>
              {isAISpeaking && (
                <div className="mt-2 flex items-center justify-center space-x-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  <div
                    className="w-2 h-2 bg-primary rounded-full animate-pulse"
                    style={{ animationDelay: "100ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-primary rounded-full animate-pulse"
                    style={{ animationDelay: "200ms" }}
                  ></div>
                </div>
              )}
            </div>
          </div>

          {/* User's video feed */}
          <div className="relative w-full max-w-xl aspect-video bg-card rounded-lg overflow-hidden shadow-xl border border-border">
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto bg-muted-foreground/20 rounded-full flex items-center justify-center">
                  <Mic className="w-12 h-12 text-muted-foreground" />
                </div>
                <p className="mt-4 text-sm text-muted-foreground">Audio Only</p>
              </div>
            </div>
            <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm px-3 py-1 rounded text-foreground text-sm border border-border">
              You
            </div>
          </div>
        </div>

        {/* Transcript and indicators area - below videos */}
        <div className="px-8 pb-8">
          {/* Current AI Message */}
          <AnimatePresence mode="wait">
            {currentAIMessage && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-4xl mx-auto bg-card/90 backdrop-blur-sm rounded-lg p-6 shadow-lg border border-border max-h-[200px] overflow-y-auto custom-scrollbar mb-4"
              >
                {showTranscript ? (
                  <div className="text-sm text-foreground">
                    {currentAIMessage}
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                      <div
                        className="w-2 h-2 bg-primary rounded-full animate-pulse"
                        style={{ animationDelay: "100ms" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-primary rounded-full animate-pulse"
                        style={{ animationDelay: "200ms" }}
                      ></div>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Preparing audio...
                    </span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Recording/Processing indicators */}
          <div className="h-8 flex items-center justify-center">
            {isRecording && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center space-x-2 text-destructive"
              >
                <div className="w-3 h-3 bg-destructive rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">
                  Recording your answer...
                </span>
              </motion.div>
            )}

            {isProcessingMedia && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center space-x-2"
              >
                <LoadingSpinner size="sm" className="text-primary" />
                <span className="text-sm font-medium text-muted-foreground">
                  Processing your response...
                </span>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom control bar */}
      <div className="bg-card border-t border-border px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-4">
          {/* End Interview button */}
          <Button
            variant="destructive"
            size="lg"
            onClick={reset}
            disabled={isRecording || isProcessingMedia}
            className="min-w-[200px]"
          >
            <PhoneOff className="w-4 h-4 mr-2" />
            End Interview
          </Button>

          {/* TTS Toggle button (placeholder) */}
          <Button
            variant="ghost"
            size="lg"
            className="min-w-[50px]"
            title="Voice enabled"
          >
            <Volume2 className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
