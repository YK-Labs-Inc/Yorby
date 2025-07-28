"use client";

import React, { useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  type AgentState,
  useRoomContext,
  useVoiceAssistant,
} from "@livekit/components-react";
import { toastAlert } from "./alert-toast";
import useChatAndTranscription from "./hooks/useChatAndTranscription";
import { useDebugMode } from "./hooks/useDebug";
import type { AppConfig } from "./types";
import { VideoChatLayout } from "./video-chat-layout";
import { AgentControlBar } from "@/app/components/livekit/agent-control-bar/agent-control-bar";
import { useParams } from "next/navigation";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";

function isAgentAvailable(agentState: AgentState) {
  return (
    agentState == "listening" ||
    agentState == "thinking" ||
    agentState == "speaking"
  );
}

interface SessionViewProps {
  appConfig: AppConfig;
  disabled: boolean;
  sessionStarted: boolean;
  onProcessInterview?: () => Promise<string>;
  interviewId: string;
}

export const SessionView = ({
  appConfig,
  disabled,
  sessionStarted,
  onProcessInterview,
  ref,
  interviewId,
}: React.ComponentProps<"div"> & SessionViewProps) => {
  const { state: agentState } = useVoiceAssistant();
  const { messages } = useChatAndTranscription();
  const room = useRoomContext();
  const { logInfo, logError } = useAxiomLogging();

  useDebugMode();

  const saveTranscript = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();

    if (!interviewId) {
      logError("transcript_write_skipped", {
        reason: "mock_interview_id not found",
      });
      return "Error: Interview ID not found";
    }

    // Process messages in reverse order to save in reverse chronological order
    const messagesToInsert = [];

    // Get current time and work backwards to preserve chronological order
    const now = new Date();
    const reversedMessages = [...messages].reverse();

    // Generate timestamps in reverse chronological order (older messages get earlier timestamps)
    for (let i = 0; i < reversedMessages.length; i++) {
      const message = reversedMessages[i];

      // Map role names - assistant messages from agent should be "model", user messages stay "user"
      const dbRole = message.from?.isLocal ? "user" : "model";

      // Extract text content from the message
      const text = message.message || "";

      // Create timestamp that preserves chronological order
      // Each message gets a timestamp that's (reversedMessages.length - i) seconds before now
      const messageTimestamp = new Date(
        now.getTime() - (reversedMessages.length - i) * 1000
      );

      const messageData = {
        mock_interview_id: interviewId,
        role: dbRole as "user" | "model",
        text: text,
        created_at: messageTimestamp.toISOString(),
      };
      messagesToInsert.push(messageData);
    }

    // Insert all messages into database
    if (messagesToInsert.length > 0) {
      try {
        const { error } = await supabase
          .from("mock_interview_messages")
          .insert(messagesToInsert);

        if (error) {
          throw error;
        }

        // Log successful transcript write
        logInfo("transcript_write_success", {
          mock_interview_id: interviewId,
          message_count: messagesToInsert.length,
        });
        return "success";
      } catch (error) {
        // Log transcript write error
        logError("transcript_write_error", {
          mock_interview_id: interviewId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }, [messages, interviewId, logInfo, logError]);

  const onDisconnect = useCallback(async () => {
    const transcriptResult = await saveTranscript();

    // If transcript save was successful, process the interview
    if (transcriptResult === "success" && onProcessInterview) {
      try {
        await onProcessInterview();
        logInfo("interview_processing_triggered", {
          mock_interview_id: interviewId,
        });
      } catch (error) {
        logError("interview_processing_failed", {
          mock_interview_id: interviewId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }, [saveTranscript, onProcessInterview, interviewId, logInfo, logError]);

  useEffect(() => {
    if (sessionStarted) {
      const timeout = setTimeout(() => {
        if (!isAgentAvailable(agentState)) {
          const reason =
            agentState === "connecting"
              ? "Agent did not join the room. "
              : "Agent connected but did not complete initializing. ";

          toastAlert({
            title: "Session ended",
            description: (
              <p className="w-full">
                {reason}
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://docs.livekit.io/agents/start/voice-ai/"
                  className="whitespace-nowrap underline"
                >
                  See quickstart guide
                </a>
                .
              </p>
            ),
          });
          room.disconnect();
        }
      }, 10_000);

      return () => clearTimeout(timeout);
    }
  }, [agentState, sessionStarted, room]);

  const { supportsChatInput, supportsVideoInput } = appConfig;
  const capabilities = {
    supportsChatInput,
    supportsVideoInput,
    supportsScreenShare: false,
  };

  // Filter messages to show only AI assistant messages
  const aiMessages = messages.filter((message) => !message.from?.isLocal);

  return (
    <main
      ref={ref}
      inert={disabled}
      className="relative h-screen overflow-hidden"
    >
      {/* Video Chat Layout with AI messages */}
      <VideoChatLayout aiMessages={aiMessages} />

      {/* Control Bar - Always visible at bottom */}
      <div className="absolute right-0 bottom-0 left-0 z-50 px-4 pb-6">
        <AnimatePresence mode="wait">
          {sessionStarted && (
            <motion.div
              key="control-bar"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{
                duration: 0.3,
                ease: "easeOut",
              }}
            >
              <div className="relative z-10 mx-auto w-fit">
                <AgentControlBar
                  capabilities={capabilities}
                  onDisconnect={onDisconnect}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
};
