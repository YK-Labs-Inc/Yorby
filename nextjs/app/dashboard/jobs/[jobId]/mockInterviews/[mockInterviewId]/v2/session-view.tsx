"use client";

import React, { useEffect } from "react";
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
import { cn } from "@/lib/utils";
import { VideoChatLayout } from "./video-chat-layout";
import { AgentControlBar } from "@/app/components/livekit/agent-control-bar/agent-control-bar";

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
}

export const SessionView = ({
  appConfig,
  disabled,
  sessionStarted,
  ref,
}: React.ComponentProps<"div"> & SessionViewProps) => {
  const { state: agentState } = useVoiceAssistant();
  const { messages } = useChatAndTranscription();
  const room = useRoomContext();

  useDebugMode();

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

  const { supportsChatInput, supportsVideoInput, supportsScreenShare } =
    appConfig;
  const capabilities = {
    supportsChatInput,
    supportsVideoInput,
    supportsScreenShare,
  };

  // Filter messages to show only AI assistant messages
  const aiMessages = messages.filter(message => !message.from?.isLocal);

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
            />
          </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
};
