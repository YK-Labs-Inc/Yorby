"use client";

import { useEffect, useRef, useState } from "react";
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
import { useKnowledgeBase } from "@/app/context/KnowledgeBaseContext";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";
import { generateMuxUploadUrl } from "./actions";

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
  const { selectedVoice, stopAudioPlayback } = useTts();
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
              videoRecordingCompletedCallback={videoRecordingCompletedCallback}
            />
          </div>
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
