"use client";

import { useMemo, useState } from "react";
import { CodeEditor } from "@/components/ui/code-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChatEntry } from "@/app/components/livekit/chat/chat-entry";
import { VideoTile } from "@/app/components/livekit/video-tile";
import { Track } from "livekit-client";
import {
  type ReceivedChatMessage,
  useLocalParticipant,
  useChat,
} from "@livekit/components-react";
import { Tables } from "@/utils/supabase/database.types";
import { saveCodingSubmission } from "./actions";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { useTranslations } from "next-intl";

interface CodingInterviewComponentProps {
  aiMessages: ReceivedChatMessage[];
  questionDetails: Pick<
    Tables<"company_interview_question_bank">,
    "id" | "question"
  >[];
  candidateInterviewId: string;
}

export default function CodingInterviewComponent({
  aiMessages,
  questionDetails,
  candidateInterviewId,
}: CodingInterviewComponentProps) {
  const [code, setCode] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionCount, setSubmissionCount] = useState<number>(0);
  const t = useTranslations("apply.codingInterview");

  // Axiom logging
  const { logInfo, logError } = useAxiomLogging();

  // Chat functionality to send messages to the agent
  const { send: sendMessage } = useChat();

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

  // Handle code submission
  const handleSubmitCode = async () => {
    if (!code.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const questionId = questionDetails?.[0]?.id;

      // Optimistically update submission count
      const newSubmissionNumber = submissionCount + 1;
      setSubmissionCount(newSubmissionNumber);

      // Save submission to database (non-blocking, fire and forget)
      if (questionId && candidateInterviewId) {
        // Create FormData for the server action
        const formData = new FormData();
        formData.append("candidateInterviewId", candidateInterviewId);
        formData.append("questionId", questionId);
        formData.append("submissionText", code);
        formData.append("submissionNumber", newSubmissionNumber.toString());

        saveCodingSubmission(formData)
          .then((result) => {
            if (result.success) {
              logInfo(t("logging.codeSubmissionSaved"), {
                candidateInterviewId,
                questionId,
                submissionNumber: newSubmissionNumber,
              });
            } else {
              // Fail silently - just log the error
              logError(t("logging.failedToSaveSubmission"), {
                candidateInterviewId,
                questionId,
                submissionNumber: newSubmissionNumber,
                error: result.error,
              });
            }
          })
          .catch((error) => {
            // Fail silently - just log the error
            logError(t("logging.unexpectedError"), {
              candidateInterviewId,
              questionId,
              submissionNumber: newSubmissionNumber,
              error: error instanceof Error ? error.message : String(error),
            });
          });
      }

      const codeMessage = `${t("codeSubmission")}
      \n${code}`;

      // Send the code to the LiveKit agent via chat
      await sendMessage(codeMessage);

      logInfo(t("logging.codeSubmittedToAgent"), {
        candidateInterviewId,
        questionId: questionDetails?.[0]?.id,
        submissionNumber: submissionCount + 1,
        codeLength: code.length,
      });
    } catch (error) {
      logError(t("logging.errorSubmittingCode"), {
        candidateInterviewId,
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative inset-0 bg-white h-full">
      <div className="grid grid-cols-12 gap-2 h-full w-full p-2">
        {/* Question Panel - Separate Column */}
        {questionDetails && questionDetails.length > 0 && (
          <div className="col-span-12 md:col-span-3 lg:col-span-3">
            <Card className="sticky top-4 h-[calc(100vh-11rem)] flex flex-col">
              <CardHeader>
                <CardTitle className="text-base">{t("problemStatement")}</CardTitle>
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
                  {t("writeSolution")}
                </CardTitle>
                <Button
                  size="sm"
                  onClick={handleSubmitCode}
                  disabled={isSubmitting || !code.trim()}
                >
                  {isSubmitting ? t("submitting") : t("submitCode")}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 pb-4">
              <CodeEditor
                value={code}
                onChange={setCode}
                placeholder={t("startCoding")}
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
                      {t("cameraOff")}
                    </div>
                  )}
                  <div className="absolute bottom-1 right-1 bg-black/70 text-white px-2 py-0.5 rounded text-xs">
                    {t("you")}
                  </div>
                </div>
              </div>

              {/* Transcript */}
              <div>
                <h4 className="text-sm font-medium mb-2">{t("aiTranscript")}</h4>
                <div className="space-y-2">
                  {aiMessages.map((m) => (
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
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
