"use client";

import React from "react";
import { Track } from "livekit-client";
import {
  type TrackReference,
  type ReceivedChatMessage,
  useLocalParticipant,
  useVoiceAssistant,
} from "@livekit/components-react";
import { AnimatePresence, motion } from "motion/react";
import { AgentTile } from "@/app/components/livekit/agent-tile";
import { AvatarTile } from "@/app/components/livekit/avatar-tile";
import { VideoTile } from "@/app/components/livekit/video-tile";
import { ChatEntry } from "@/app/components/livekit/chat/chat-entry";

interface VideoChatLayoutProps {
  aiMessages: ReceivedChatMessage[];
}

export function VideoChatLayout({ aiMessages }: VideoChatLayoutProps) {
  const {
    state: agentState,
    audioTrack: agentAudioTrack,
    videoTrack: agentVideoTrack,
  } = useVoiceAssistant();

  const { localParticipant } = useLocalParticipant();
  const cameraPublication = localParticipant.getTrackPublication(
    Track.Source.Camera
  );
  const cameraTrack: TrackReference | undefined = cameraPublication
    ? {
        source: Track.Source.Camera,
        participant: localParticipant,
        publication: cameraPublication,
      }
    : undefined;

  const isAvatar = agentVideoTrack !== undefined;

  return (
    <div className="absolute inset-0 bg-background">
      <div className="flex flex-col h-full w-full p-4 pb-36 gap-4">
        {/* Video Tiles Container */}
        <div className="flex gap-4" style={{ height: "60%" }}>
          {/* AI Agent Video - Left Side */}
          <div className="flex-1 relative bg-muted rounded-lg overflow-hidden">
            <div className="flex h-full w-full gap-4 p-4">
              {!isAvatar && agentAudioTrack && (
                <AgentTile
                  state={agentState}
                  audioTrack={agentAudioTrack}
                  className="h-full w-full"
                />
              )}
              {isAvatar && agentVideoTrack && (
                <AvatarTile
                  videoTrack={agentVideoTrack}
                  className="h-full [&>video]:h-full [&>video]:w-full [&>video]:object-cover"
                />
              )}
            </div>
            {!agentAudioTrack && !agentVideoTrack && (
              <div className="h-full w-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 bg-muted-foreground/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <svg
                      className="w-12 h-12 text-muted-foreground"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <p className="text-muted-foreground">Connecting to AI...</p>
                </div>
              </div>
            )}
            <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded text-sm">
              AI Interviewer
            </div>
          </div>

          {/* User Video - Right Side */}
          <div className="flex-1 relative bg-muted rounded-lg overflow-hidden">
            {cameraTrack && (
              <VideoTile
                trackRef={cameraTrack}
                className="h-full w-full [&>video]:h-full [&>video]:w-full [&>video]:object-cover"
              />
            )}
            {!cameraTrack && (
              <div className="h-full w-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 bg-muted-foreground/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <svg
                      className="w-12 h-12 text-muted-foreground"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <p className="text-muted-foreground">Camera Off</p>
                </div>
              </div>
            )}
            <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded text-sm">
              You
            </div>
          </div>
        </div>

        {/* AI Messages Container */}
        <div className="flex-1 bg-muted/50 rounded-lg p-4 overflow-y-auto">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Interview Questions</h3>
          <div className="space-y-3">
            <AnimatePresence mode="wait">
              {aiMessages.length > 0 ? (
                <motion.div
                  key={aiMessages[aiMessages.length - 1].id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChatEntry
                    hideName
                    hideTimestamp
                    entry={aiMessages[aiMessages.length - 1]}
                    className="bg-background rounded-lg p-3 shadow-sm"
                  />
                </motion.div>
              ) : (
                <p className="text-muted-foreground text-sm">Waiting for interview questions...</p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
