"use client";

import { useMemo, useState } from "react";
import type { AppConfig } from "@/app/dashboard/jobs/[jobId]/mockInterviews/[mockInterviewId]/v2/types";
import { CodeEditor } from "@/components/ui/code-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChatEntry } from "@/app/components/livekit/chat/chat-entry";
import { VideoTile } from "@/app/components/livekit/video-tile";
import { Track } from "livekit-client";
import {
  type ReceivedChatMessage,
  useLocalParticipant,
  useVoiceAssistant,
} from "@livekit/components-react";
import { Tables } from "@/utils/supabase/database.types";

interface CodingInterviewComponentProps {
  interviewId: string;
  appConfig: AppConfig;
  onProcessInterview: () => Promise<string>;
  defaultShowTranscript?: boolean;
  defaultShowAiPanel?: boolean;
  aiMessages: ReceivedChatMessage[];
  questionDetails: Pick<
    Tables<"company_interview_question_bank">,
    "question"
  >[];
}

export default function CodingInterviewComponent({
  onProcessInterview,
  defaultShowTranscript = true,
  defaultShowAiPanel = true,
  aiMessages,
  questionDetails,
}: CodingInterviewComponentProps) {
  const [code, setCode] = useState<string>("");
  const [showTranscript] = useState<boolean>(defaultShowTranscript);

  // Candidate camera PIP
  const { localParticipant } = useLocalParticipant();
  const cameraPublication = localParticipant.getTrackPublication(
    Track.Source.Camera
  );
  const cameraTrack = useMemo(() => {
    return cameraPublication
      ? {
          source: Track.Source.Camera,
          participant: localParticipant,
          publication: cameraPublication,
        }
      : undefined;
  }, [cameraPublication, localParticipant]);

  // Optional AI mini panel
  const {
    state: agentState,
    audioTrack: agentAudioTrack,
    videoTrack,
  } = useVoiceAssistant();
  const isAvatar = videoTrack !== undefined;

  const latestAiMessage = aiMessages.length
    ? aiMessages[aiMessages.length - 1]
    : undefined;

  return (
    <div className="relative inset-0 bg-white h-full">
      <div className="grid grid-cols-12 gap-2 h-full w-full p-2">
        {/* Question Panel - Separate Column */}
        {questionDetails && questionDetails.length > 0 && (
          <div className="col-span-12 md:col-span-3 lg:col-span-3">
            <Card className="sticky top-4 h-[calc(100vh-11rem)] flex flex-col">
              <CardHeader>
                <CardTitle className="text-base">Problem Statement</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto">
                <div className="text-sm whitespace-pre-wrap">
                  {questionDetails[0].question}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Editor Area */}
        <div
          className={`${
            questionDetails && questionDetails.length > 0
              ? "col-span-12 md:col-span-6 lg:col-span-6"
              : "col-span-12 md:col-span-8 lg:col-span-9"
          } flex flex-col`}
        >
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base text-muted-foreground font-normal">
                  Write your solution below
                </CardTitle>
                <Button size="sm" onClick={onProcessInterview}>
                  Submit Code
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 pb-4">
              <CodeEditor
                value={code}
                onChange={setCode}
                placeholder="// Start coding..."
                className="h-full"
                minHeight="100%"
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Rail: video tiles + transcript */}
        <aside className="col-span-12 md:col-span-3 lg:col-span-3">
          <Card className="sticky top-4 h-[calc(100vh-11rem)] flex flex-col">
            <CardContent className="pt-6 space-y-4 overflow-y-auto">
              {/* Video tile */}
              <div className="space-y-2">
                <div className="relative h-32 rounded-md overflow-hidden bg-muted/10 border">
                  {cameraTrack ? (
                    <VideoTile
                      trackRef={cameraTrack}
                      className="h-full w-full [&>video]:h-full [&>video]:w-full [&>video]:object-cover"
                    />
                  ) : (
                    <div className="h-full w-full grid place-items-center text-muted-foreground text-sm">
                      Camera Off
                    </div>
                  )}
                  <div className="absolute bottom-1 right-1 bg-black/70 text-white px-2 py-0.5 rounded text-xs">
                    You
                  </div>
                </div>
              </div>

              {/* Transcript */}
              {showTranscript && (
                <div>
                  <h4 className="text-sm font-medium mb-2">AI Transcript</h4>
                  <div className="space-y-2">
                    {aiMessages.length ? (
                      aiMessages.map((m) => (
                        <div
                          key={m.id}
                          className="bg-muted/10 rounded-md p-2 border"
                        >
                          <ChatEntry
                            hideName
                            hideTimestamp
                            entry={m}
                            className="[&>*]:!bg-transparent"
                          />
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        No messages yet...
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
