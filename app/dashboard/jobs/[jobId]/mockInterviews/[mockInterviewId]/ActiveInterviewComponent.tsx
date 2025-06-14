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
import { useTts } from "@/app/context/TtsContext";
import { useKnowledgeBase } from "@/app/context/KnowledgeBaseContext";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";
import { generateMuxUploadUrl } from "./actions";
import { useMediaDevice } from "./MediaDeviceContext";
import { PhoneOff, Mic, Square, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Markdown from "react-markdown";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

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
  const videoChunksRef = useRef<Blob[]>([]);
  const { logError } = useAxiomLogging();
  const [showEndModal, setShowEndModal] = useState(false);
  const user = useUser();
  const session = useSession();
  const { selectedVoice } = useTts();
  const { updateKnowledgeBase } = useKnowledgeBase();

  // Track pending uploads
  const [pendingUploads, setPendingUploads] = useState<Set<string>>(new Set());
  const pendingUploadsRef = useRef<Set<string>>(new Set());

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

  const saveMockInterviewMessageRecording = async ({
    mockInterviewId,
    messageId,
    videoChunks,
    userId,
    jobId,
  }: {
    mockInterviewId: string;
    messageId: string;
    videoChunks: Blob[];
    userId: string;
    jobId: string;
  }) => {
    // Add to pending uploads
    const uploadId = `${messageId}-${Date.now()}`;
    pendingUploadsRef.current.add(uploadId);
    setPendingUploads(new Set(pendingUploadsRef.current));

    try {
      await Promise.all([
        saveMockInterviewMessageRecordingInSupabaseStorage({
          mockInterviewId,
          messageId,
          videoChunks,
          userId,
          jobId,
        }),
        saveMockInterviewMessageRecordingInMux({
          messageId,
          videoChunks,
        }),
      ]);
    } catch (error) {
      logError("Error in saveMockInterviewMessageRecording", {
        error,
        messageId,
      });
    } finally {
      // Remove from pending uploads
      pendingUploadsRef.current.delete(uploadId);
      setPendingUploads(new Set(pendingUploadsRef.current));
    }
  };

  const saveMockInterviewMessageRecordingInMux = async ({
    messageId,
    videoChunks,
  }: {
    messageId: string;
    videoChunks: Blob[];
  }) => {
    const { uploadUrl, error } = await generateMuxUploadUrl({
      databaseId: messageId,
      table: "mock_interview_message_mux_metadata",
    });
    if (error || !uploadUrl) {
      logError("Error generating Mux upload URL", { error });
      return;
    }
    try {
      // Combine videoChunks into a single Blob
      const videoBlob = new Blob(videoChunks);
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: videoBlob,
      });
      if (!uploadResponse.ok) {
        logError("Failed to upload video to Mux", {
          status: uploadResponse.status,
          statusText: uploadResponse.statusText,
          messageId,
        });
      }
    } catch (err) {
      logError("Error uploading video to Mux", { error: err });
    }
  };

  const saveMockInterviewMessageRecordingInSupabaseStorage = async ({
    mockInterviewId,
    messageId,
    videoChunks,
    userId,
    jobId,
  }: {
    mockInterviewId: string;
    messageId: string;
    videoChunks: Blob[];
    userId: string;
    jobId: string;
  }) => {
    const supabase = createSupabaseBrowserClient();
    try {
      // 1. Fetch coach_id for the job
      const { data: job, error: jobError } = await supabase
        .from("custom_jobs")
        .select("coach_id")
        .eq("id", jobId)
        .single();
      if (jobError) throw new Error(jobError.message);
      const coachId = job?.coach_id;

      let coachUserId = null;
      if (coachId) {
        // Fetch the coach's user_id from the coaches table
        const { data: coach, error: coachError } = await supabase
          .from("coaches")
          .select("user_id")
          .eq("id", coachId)
          .maybeSingle();
        if (coachError) {
          logError("Error fetching coach user_id", {
            error: coachError.message,
            coachId,
          });
          throw coachError;
        }
        coachUserId = coach?.user_id;
      }

      // 2. Build file path
      const fileName = `${Date.now()}`;
      let filePath = "";
      if (coachUserId) {
        filePath = `${userId}/coaches/${coachUserId}/mockInterviews/${mockInterviewId}/messages/${messageId}/${fileName}`;
      } else {
        filePath = `${userId}/mockInterviews/${mockInterviewId}/messages/${messageId}/${fileName}`;
      }

      // 3. Create Blob and infer type
      const videoBlob = new Blob(videoChunks);
      const fileType = videoBlob.type || "video/webm";
      const fileExt = fileType.split("/")[1] || "webm";
      const fullFilePath = `${filePath}.${fileExt}`;

      // 4. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("mock-interview-messages")
        .upload(fullFilePath, videoBlob, {
          contentType: fileType,
          upsert: true,
        });
      if (uploadError) throw new Error(uploadError.message);

      // 5. Call API route to update DB
      const response = await fetch(
        `/api/mockInterviews/${mockInterviewId}/messages/${messageId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bucket_name: "mock-interview-messages",
            recording_path: fullFilePath,
          }),
        }
      );
      if (!response.ok) {
        logError("Failed to update mock_interview_messages", {
          error: await response.text(),
        });
      }
    } catch (err) {
      logError("Error in saveMockInterviewMessageRecording:", { error: err });
    }
  };

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

      // Update knowledge base with user's message
      void updateKnowledgeBase([
        ...prevMessages,
        {
          role: "user",
          content: message,
        },
      ]);

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
      const { response: aiResponse, savedMessageId } =
        (await chatResponse.json()) as {
          response: string;
          savedMessageId: string;
        };
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

      if (videoChunksRef.current.length > 0) {
        if (user) {
          await saveMockInterviewMessageRecording({
            mockInterviewId,
            messageId: savedMessageId,
            videoChunks: videoChunksRef.current,
            userId: user.id,
            jobId,
          });
        }
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
  const videoRecordingCompletedCallback = async (videoBlob: Blob[]) => {
    videoChunksRef.current = videoBlob;
  };

  useEffect(() => {
    if (firstQuestionAudioIsInitialized && stream) {
      // Set up video display
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    }
  }, [firstQuestionAudioIsInitialized, stream]);

  const endInterview = () => {
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

  // Add states for video interview UI
  const [isUserRecording, setIsUserRecording] = useState(false);
  const [currentAIMessage, setCurrentAIMessage] = useState<string>("");
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const audioTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    startRecording,
    stopRecording: stopMediaRecording,
    isProcessing: isProcessingMedia,
  } = useMediaDevice();

  const { isTtsEnabled, setIsTtsEnabled, speakMessage, stopAudioPlayback } =
    useTts();

  // Get latest AI message
  useEffect(() => {
    const lastAIMessage = messages.filter((m) => m.role === "assistant").pop();
    if (lastAIMessage && lastAIMessage.content) {
      setCurrentAIMessage(lastAIMessage.content as string);
    }
  }, [messages]);

  // Auto-play AI responses with TTS logic
  useEffect(() => {
    if (currentAIMessage && isTtsEnabled && !isUserRecording) {
      setIsAISpeaking(true);

      // Set timeout for 5 seconds
      audioTimeoutRef.current = setTimeout(() => {
        // If audio hasn't started playing after 5 seconds, cancel and show transcript
        setIsAISpeaking(false);
        setShowTranscript(true);
        stopAudioPlayback();
      }, 5000);

      speakMessage(currentAIMessage, {
        onPlaybackStart: () => {
          // Clear timeout when audio starts
          if (audioTimeoutRef.current) {
            clearTimeout(audioTimeoutRef.current);
            audioTimeoutRef.current = null;
          }
          setShowTranscript(true);
        },
        onPlaybackEnd: () => {
          setIsAISpeaking(false);
          if (audioTimeoutRef.current) {
            clearTimeout(audioTimeoutRef.current);
            audioTimeoutRef.current = null;
          }
        },
      });
    } else if (currentAIMessage && !isTtsEnabled) {
      // If TTS is disabled, show transcript immediately
      setShowTranscript(true);
      setIsAISpeaking(false);
    }

    // Cleanup on unmount
    return () => {
      if (audioTimeoutRef.current) {
        clearTimeout(audioTimeoutRef.current);
      }
    };
  }, [currentAIMessage, isTtsEnabled]);

  // Handle TTS toggle
  const handleTtsToggle = () => {
    const newTtsEnabled = !isTtsEnabled;
    setIsTtsEnabled(newTtsEnabled);

    if (!newTtsEnabled) {
      // If disabling TTS, stop any ongoing audio playback
      stopAudioPlayback();
      setIsAISpeaking(false);
      setShowTranscript(true);
      if (audioTimeoutRef.current) {
        clearTimeout(audioTimeoutRef.current);
        audioTimeoutRef.current = null;
      }
    } else if (currentAIMessage && !isUserRecording) {
      // If enabling TTS and there's a current AI message, start playing it
      setIsAISpeaking(true);
      setShowTranscript(false);

      // Set 5-second failsafe timeout: if audio doesn't start playing within 5 seconds,
      // stop waiting and show the transcript so users aren't stuck with "Preparing audio..."
      audioTimeoutRef.current = setTimeout(() => {
        setIsAISpeaking(false);
        setShowTranscript(true);
        stopAudioPlayback();
      }, 5000);

      speakMessage(currentAIMessage, {
        onPlaybackStart: () => {
          if (audioTimeoutRef.current) {
            clearTimeout(audioTimeoutRef.current);
            audioTimeoutRef.current = null;
          }
          setShowTranscript(true);
        },
        onPlaybackEnd: () => {
          setIsAISpeaking(false);
          if (audioTimeoutRef.current) {
            clearTimeout(audioTimeoutRef.current);
            audioTimeoutRef.current = null;
          }
        },
      });
    }
  };

  // Handle recording start/stop
  const handleRecordingToggle = useCallback(async () => {
    if (isUserRecording) {
      // Stop recording and immediately send
      setIsUserRecording(false);
      await stopMediaRecording();
      // The transcribed text will be sent automatically via processAudioAndSend
    } else {
      // Start recording
      setIsUserRecording(true);

      await startRecording({
        audioRecordingCompletedCallback: async (audioBlob) => {
          await processAudioAndSend(audioBlob);
        },
        videoRecordingCompletedCallback,
      });
    }
  }, [isUserRecording]);

  // Process audio and automatically send message
  const processAudioAndSend = async (audioChunks: Blob[]) => {
    if (audioChunks.length === 0) return;

    try {
      const audioBlob = new Blob(audioChunks, { type: "audio/webm" });

      // Transcribe audio
      const formData = new FormData();
      formData.append("audioFileToTranscribe", audioBlob);
      formData.append("source", "mock-interview");

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.status}`);
      }

      const { transcription } = (await response.json()) as {
        transcription: string;
      };

      if (transcription.trim()) {
        // Immediately send the transcribed message
        await handleSendMessage(transcription);
      }
    } catch (error) {
      logError("Error processing audio:", { error });
    }
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Video feeds row - both centered at same height */}
        <div className="flex-1 flex items-center justify-center p-8 gap-8">
          {/* AI Interviewer video */}
          <div className={`relative w-full max-w-xl aspect-video bg-card rounded-lg overflow-hidden shadow-xl border-2 flex items-center justify-center transition-all duration-300 ${
            isAISpeaking 
              ? "border-primary shadow-primary/20 shadow-2xl" 
              : "border-border"
          }`}>
            {/* Speaking animation overlay */}
            {isAISpeaking && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 rounded-lg border-2 border-primary animate-ping opacity-75" />
                <div className="absolute inset-0 rounded-lg border-2 border-primary animate-pulse" />
              </div>
            )}
            <div className="text-center p-8">
              {/* AI Avatar */}
              <div className={`w-32 h-32 mx-auto bg-primary rounded-full flex items-center justify-center shadow-xl transition-transform duration-300 ${
                isAISpeaking ? "scale-110" : "scale-100"
              }`}>
                <div className="text-primary-foreground text-5xl font-bold">
                  AI
                </div>
              </div>
              <p className="mt-4 text-sm font-medium text-foreground">
                {t("aiInterviewer")}
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
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform scale-x-[-1]"
            />
            <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm px-3 py-1 rounded text-foreground text-sm border border-border">
              {t("you")}
            </div>
          </div>
        </div>

        {/* Transcript and indicators area - below videos */}
        <div className="px-8 pb-8">
          {/* Current AI Message */}
          <AnimatePresence mode="wait">
            {(currentAIMessage || isProcessingAIResponse) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-4xl mx-auto bg-card/90 backdrop-blur-sm rounded-lg p-6 shadow-lg border border-border max-h-[200px] overflow-y-auto custom-scrollbar mb-4"
              >
                {isProcessingAIResponse ? (
                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-1">
                      <div
                        className="w-2 h-2 bg-primary rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-primary rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-primary rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      ></div>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {t("aiIsThinking")}
                    </span>
                  </div>
                ) : showTranscript ? (
                  <div className="markdown prose-sm max-w-none">
                    <Markdown>{currentAIMessage}</Markdown>
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
                      {t("preparingAudio")}
                    </span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Recording/Processing indicators */}
          <div className="h-8 flex items-center justify-center">
            {isUserRecording && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center space-x-2 text-destructive"
              >
                <div className="w-3 h-3 bg-destructive rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">
                  {t("recordingYourAnswer")}
                </span>
              </motion.div>
            )}

            {isProcessingMedia && !isProcessingAIResponse && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center space-x-2"
              >
                <LoadingSpinner size="sm" className="text-primary" />
                <span className="text-sm font-medium text-muted-foreground">
                  {t("transcribingYourResponse")}
                </span>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom control bar */}
      <div className="bg-card border-t border-border px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-4">
          {/* Record Answer button */}
          <Button
            variant={isUserRecording ? "destructive" : "default"}
            size="lg"
            onClick={handleRecordingToggle}
            disabled={
              isProcessingAIResponse || isProcessingMedia || isAISpeaking
            }
            className={`min-w-[200px] ${isUserRecording ? "animate-pulse" : ""}`}
          >
            {isUserRecording ? (
              <>
                <Square className="w-4 h-4 mr-2" />
                Stop Recording
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 mr-2" />
                Record Answer
              </>
            )}
          </Button>

          {/* End Interview button */}
          <Button
            variant="destructive"
            size="lg"
            onClick={() => setShowEndModal(true)}
            disabled={
              isUserRecording || isProcessingMedia || pendingUploads.size > 0
            }
            className="min-w-[200px]"
          >
            <PhoneOff className="w-4 h-4 mr-2" />
            End Interview
          </Button>

          {/* TTS Toggle button */}
          <Button
            variant="ghost"
            size="lg"
            onClick={() => handleTtsToggle()}
            className="min-w-[50px]"
            title={isTtsEnabled ? "Turn off voice" : "Turn on voice"}
          >
            {isTtsEnabled ? (
              <Volume2 className="w-5 h-5" />
            ) : (
              <VolumeX className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>

      <EndInterviewModal
        isOpen={showEndModal}
        onClose={() => setShowEndModal(false)}
        mockInterviewId={mockInterviewId}
        jobId={jobId}
        endInterview={endInterview}
        hasPendingUploads={pendingUploads.size > 0}
      />
    </div>
  );
}
