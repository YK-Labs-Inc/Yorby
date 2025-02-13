"use client";

import { useState, useRef, useEffect } from "react";
import { MonitorUp, LogOut, Loader2, Settings2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { detectQuestions } from "../actions";
import { useDeepgram } from "@/context/DeepgramContext";
import {
  LiveTranscriptionEvent,
  LiveTranscriptionEvents,
  SOCKET_STATES,
} from "@deepgram/sdk";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { uploadFile } from "@/utils/storage";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export function Session({
  interviewCopilotId,
}: {
  interviewCopilotId: string;
}) {
  const t = useTranslations("interviewCopilots.session");
  const [isSelectingMeeting, setIsSelectingMeeting] = useState(true);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTranscriptionService, setLoadingTranscriptionService] =
    useState(false);
  const [transcript, setTranscript] = useState<string[][]>([[]]);
  const inputTokenCountRef = useRef(0);
  const outputTokenCountRef = useRef(0);
  const contextBufferAmount = 2;
  const [questionsWithAnswers, setQuestionsWithAnswers] = useState<
    {
      question: string;
      answer: string;
    }[]
  >([]);
  const latestQuestionsWithAnswersRef = useRef(questionsWithAnswers);
  const videoRef = useRef<HTMLVideoElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const copilotRef = useRef<HTMLDivElement>(null);
  const { logError, logInfo } = useAxiomLogging();
  const transcriptIndexRef = useRef(0);
  const previousStartRef = useRef<number | null>(null);
  const latestTranscriptRef = useRef<string[][]>(transcript);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const {
    connection,
    connectToDeepgram,
    connectionState,
    disconnectFromDeepgram,
  } = useDeepgram();
  const keepAliveInterval = useRef<NodeJS.Timeout | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const recordedChunksRef = useRef<Blob[]>([]);
  const router = useRouter();
  const [transcriptAutoScroll, setTranscriptAutoScroll] = useState(true);
  const [copilotAutoScroll, setCopilotAutoScroll] = useState(true);
  const [responseFormat, setResponseFormat] = useState<"verbatim" | "bullet">(
    "verbatim"
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Auto-scroll effect for both panels
  useEffect(() => {
    const scrollToBottom = (
      element: HTMLDivElement | null,
      shouldScroll: boolean
    ) => {
      if (!element || !shouldScroll) return;

      const isAtBottom =
        element.scrollHeight - element.clientHeight <= element.scrollTop + 100;
      if (isAtBottom) {
        setTimeout(() => {
          element.scrollTo({
            top: element.scrollHeight,
            behavior: "smooth",
          });
        }, 100);
      }
    };

    scrollToBottom(transcriptRef.current, transcriptAutoScroll);
    scrollToBottom(copilotRef.current, copilotAutoScroll);
  }, [
    transcript,
    questionsWithAnswers,
    transcriptAutoScroll,
    copilotAutoScroll,
  ]);

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const handleSelectMeeting = async () => {
    try {
      setIsLoading(true);
      if (!navigator.mediaDevices?.getDisplayMedia) {
        alert(
          "Screen sharing is not supported in this browser — please switch to Google chrome for the best experience"
        );
        setIsLoading(false);
        return;
      }

      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: true, // Simplified video constraints
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      const audioTrack = mediaStream.getAudioTracks()[0];
      if (!audioTrack) {
        throw new Error("No audio track available");
      }

      // Update state first
      setStream(mediaStream);
      setIsSelectingMeeting(false);

      // Then handle video element
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch((e) => {
            logError("Error playing video:", { error: e });
          });
        };

        videoRef.current.onerror = (e) => {
          logError("Video error:", { error: e });
        };
      } else {
        logError("No video element reference available");
      }
    } catch (error) {
      logError("Error selecting meeting:", { error });
      setIsLoading(false);
    }
  };

  const startTranscription = async () => {
    setLoadingTranscriptionService(true);
    setIsTranscribing(false);
    if (!stream) {
      alert(t("error.generic"));
      return;
    }
    try {
      setupDeepgramRealTimeTranscription();
    } catch (error) {
      logError("Error starting transcription:", { error });
      setIsTranscribing(false);
    }
  };

  const setupDeepgramRealTimeTranscription = () => {
    connectToDeepgram({
      model: "nova-3",
      interim_results: true,
      smart_format: true,
      filler_words: true,
    });
  };

  useEffect(() => {
    if (!connection) return;

    const onData = (e: BlobEvent) => {
      // iOS SAFARI FIX:
      // Prevent packetZero from being sent. If sent at size 0, the connection will close.
      if (e.data.size > 0) {
        connection?.send(e.data);
      }
    };

    const onTranscript = (data: LiveTranscriptionEvent) => {
      const { is_final: isFinal, speech_final: speechFinal, start } = data;
      let transcriptText = data.channel.alternatives[0].transcript;

      if (isFinal && transcriptText !== "") {
        setTranscript((prev) => {
          const updated = [...prev];

          // Ensure current paragraph exists
          if (!updated[transcriptIndexRef.current]) {
            updated[transcriptIndexRef.current] = [];
          }

          // Handle sentence updates within the current paragraph
          if (previousStartRef.current !== start) {
            // New start time means new sentence
            updated[transcriptIndexRef.current].push(transcriptText);
          } else {
            // Same start time means update the last sentence
            const currentParagraph = updated[transcriptIndexRef.current];
            if (currentParagraph.length > 0) {
              currentParagraph[currentParagraph.length - 1] = transcriptText;
            } else {
              currentParagraph.push(transcriptText);
            }
          }

          previousStartRef.current = start;
          return updated;
        });

        // Handle paragraph breaks
        if (speechFinal) {
          const transcriptIndex = transcriptIndexRef.current;
          transcriptIndexRef.current += 1;
          processTranscript(latestTranscriptRef.current[transcriptIndex]);
          setTranscript((prev) => [...prev, []]);
          previousStartRef.current = null; // Reset start time for new paragraph
        }
      }
    };

    if (stream && connectionState === SOCKET_STATES.open) {
      setLoadingTranscriptionService(false);
      setIsTranscribing(true);
      const mediaRecorder = new MediaRecorder(
        new MediaStream(stream.getAudioTracks())
      );
      mediaRecorder.addEventListener("dataavailable", onData);
      mediaRecorder.start(500);
      connection.addListener(LiveTranscriptionEvents.Transcript, onTranscript);
    }

    return () => {
      connection.removeListener(
        LiveTranscriptionEvents.Transcript,
        onTranscript
      );
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
      }
    };
  }, [connectionState, stream]);

  useEffect(() => {
    if (!connection) return;

    if (connectionState === SOCKET_STATES.open) {
      connection.keepAlive();

      keepAliveInterval.current = setInterval(() => {
        connection.keepAlive();
      }, 10000);
    } else {
      if (keepAliveInterval.current) {
        clearInterval(keepAliveInterval.current);
      }
    }

    return () => {
      if (keepAliveInterval.current) {
        clearInterval(keepAliveInterval.current);
      }
    };
  }, [connectionState]);

  useEffect(() => {
    if (!stream) return;

    const mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current = [...recordedChunksRef.current, event.data];
      }
    };

    mediaRecorder.onstop = async () => {
      // Create and upload the recording
      if (recordedChunksRef.current.length > 0) {
        const blob = new Blob(recordedChunksRef.current, {
          type: "video/webm",
        });
        await handleUpload(blob);
      }
    };
    mediaRecorder.start(1000);
    mediaRecorderRef.current = mediaRecorder;

    return () => {
      mediaRecorder.stop();
    };
  }, [stream]);

  const handleUpload = async (videoBlob: Blob) => {
    try {
      setIsUploading(true);
      const supabase = createSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("No access token available");
      }

      const file = new File([videoBlob], `${interviewCopilotId}.webm`, {
        type: "video/webm",
      });
      const filePath = `${session.user.id}/interview-copilots/${interviewCopilotId}`;

      await uploadFile({
        bucketName: "interview_copilot_recordings",
        filePath,
        file,
        setProgress: setUploadProgress,
        onComplete: async () => {
          // Then update the interview data
          await updateInterviewCopilotData(filePath);
          setIsUploading(false);
        },
        accessToken: session.access_token,
        logError,
        logInfo,
      });
    } catch (error: any) {
      logError("Error uploading interview recording", { error: error.message });
      setIsUploading(false);
    }
  };

  const updateInterviewCopilotData = async (filePath: string) => {
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: filePathError } = await supabase
        .from("interview_copilots")
        .update({
          file_path: filePath,
        })
        .eq("id", interviewCopilotId);

      if (filePathError) {
        logError("Error updating interview copilot file path", {
          error: filePathError.message,
        });
      }
      const now = new Date();
      const formattedDate = now.toLocaleString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      });

      // First update the interview copilot main data
      const { error: updateError } = await supabase
        .from("interview_copilots")
        .update({
          input_tokens_count: inputTokenCountRef.current,
          output_tokens_count: outputTokenCountRef.current,
          title: `${formattedDate}`,
          status: "complete",
        })
        .eq("id", interviewCopilotId);

      if (updateError) {
        logError("Error updating interview copilot data", {
          error: updateError.message,
        });
        return;
      }

      // Then insert all questions and answers
      const questionsAndAnswersToInsert =
        latestQuestionsWithAnswersRef.current.map((qa) => ({
          interview_copilot_id: interviewCopilotId,
          question: qa.question,
          answer: qa.answer,
        }));

      const { error: insertError } = await supabase
        .from("interview_copilot_questions_and_answers")
        .insert(questionsAndAnswersToInsert);

      if (insertError) {
        logError("Error inserting questions and answers", {
          error: insertError.message,
        });
      }
      router.push(`/dashboard/interview-copilots/${interviewCopilotId}/review`);
    } catch (error: any) {
      logError("Error updating interview copilot data", {
        error: error.message,
      });
    }
  };

  const stopTranscription = async () => {
    try {
      // Clean up media recorder
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
      }

      // Close Deepgram transcription service
      if (connection) {
        disconnectFromDeepgram();
      }

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    } catch (error: any) {
      logError("Error stopping transcription", { error: error.message });
    }
  };

  const onLeave = () => {
    stopTranscription();
  };

  useEffect(() => {
    latestTranscriptRef.current = transcript;
  }, [transcript]);

  useEffect(() => {
    latestQuestionsWithAnswersRef.current = questionsWithAnswers;
  }, [questionsWithAnswers]);

  const processTranscript = async (transcript: string[]) => {
    const questions = await detectQuestionsFromTranscript(transcript);
    questions.forEach((question) => {
      processQuestion(question);
    });
  };

  const detectQuestionsFromTranscript = async (currentParagraph: string[]) => {
    let contextBuffer = "";

    // Get previous paragraphs for context
    if (transcriptIndexRef.current > 0) {
      const startIndex = Math.max(
        0,
        transcriptIndexRef.current - contextBufferAmount
      );

      // Get the previous paragraphs up to the context buffer amount
      const previousParagraphs = latestTranscriptRef.current
        .slice(startIndex, transcriptIndexRef.current)
        .filter((paragraph) => paragraph.length > 0); // Only include non-empty paragraphs

      if (previousParagraphs.length > 0) {
        // Join sentences within each paragraph, then join paragraphs with newlines
        contextBuffer =
          previousParagraphs
            .map((paragraph) => paragraph.join(" "))
            .join("\n") + "\n";
      }
    }

    // Join current paragraph sentences with spaces
    const currentText = currentParagraph.join(" ");
    const textToProcess = contextBuffer + currentText;

    const data = new FormData();
    data.append("transcript", textToProcess);
    latestQuestionsWithAnswersRef.current.forEach((q) => {
      data.append("existingQuestions", q.question);
    });

    const {
      data: questions,
      inputTokenCount,
      outputTokenCount,
    } = await detectQuestions(data);
    inputTokenCountRef.current += inputTokenCount;
    outputTokenCountRef.current += outputTokenCount;
    return questions;
  };

  const processQuestion = async (question: string) => {
    setQuestionsWithAnswers((prev) => [...prev, { question, answer: "" }]);

    try {
      const response = await fetch("/api/answer-question", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          interviewCopilotId,
          question,
          responseFormat,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get answer");
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      let accumulatedResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        try {
          const textChunk = new TextDecoder().decode(value);
          const { inputTokens, outputTokens } = JSON.parse(textChunk) as {
            inputTokens: number;
            outputTokens: number;
          };
          inputTokenCountRef.current += inputTokens;
          outputTokenCountRef.current += outputTokens;
          continue;
        } catch {
          // Do nothing
          if (done) {
            break;
          }
          const textChunk = new TextDecoder().decode(value);
          accumulatedResponse += textChunk;
          setQuestionsWithAnswers((prev) =>
            prev.map((q) =>
              q.question === question
                ? { ...q, answer: accumulatedResponse }
                : q
            )
          );
        }
      }

      // Update token counts
      // inputTokenCountRef.current += totalInputTokens;
      // outputTokenCountRef.current += totalOutputTokens;
    } catch (error) {
      logError("Error processing question", { error });
      setQuestionsWithAnswers((prev) =>
        prev.filter((q) => q.question !== question)
      );
    }
  };

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {t("controls.transcriptAutoScroll")}
            </span>
            <Button
              variant="outline"
              size="sm"
              className={transcriptAutoScroll ? "bg-blue-50 text-blue-600" : ""}
              onClick={() => setTranscriptAutoScroll(!transcriptAutoScroll)}
            >
              {transcriptAutoScroll ? "On" : "Off"}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {t("controls.copilotAutoScroll")}
            </span>
            <Button
              variant="outline"
              size="sm"
              className={copilotAutoScroll ? "bg-blue-50 text-blue-600" : ""}
              onClick={() => setCopilotAutoScroll(!copilotAutoScroll)}
            >
              {copilotAutoScroll ? "On" : "Off"}
            </Button>
          </div>
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon">
                <Settings2 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Interview Copilot Settings</DialogTitle>
                <DialogDescription>
                  Configure how your interview copilot behaves and responds
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Response Format</CardTitle>
                    <CardDescription>
                      Choose how you want the copilot to format its responses
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup
                      value={responseFormat}
                      onValueChange={(value: "verbatim" | "bullet") =>
                        setResponseFormat(value)
                      }
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="verbatim" id="verbatim" />
                        <Label htmlFor="verbatim" className="flex flex-col">
                          <span className="font-medium">Verbatim</span>
                          <span className="text-sm text-gray-500">
                            Word-for-word responses
                          </span>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        <RadioGroupItem value="bullet" id="bullet" />
                        <Label htmlFor="bullet" className="flex flex-col">
                          <span className="font-medium">Bullet Points</span>
                          <span className="text-sm text-gray-500">
                            Concise bullet-point format
                          </span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>
              </div>
              <DialogFooter>
                <Button onClick={() => setIsSettingsOpen(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <div className="flex items-center gap-2">
          {isTranscribing ? (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">{t("stopRecording")}</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("endInterview")}</DialogTitle>
                  <DialogDescription>
                    {t("endInterviewConfirmation")}
                  </DialogDescription>
                </DialogHeader>
                {isUploading && (
                  <div className="mt-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      {t("uploading")} ({uploadProgress}%)
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
                <DialogFooter className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={isUploading}
                  >
                    {t("cancel")}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      stopTranscription();
                    }}
                    disabled={isUploading}
                  >
                    {t("confirm")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : (
            <Button
              onClick={startTranscription}
              disabled={!stream || loadingTranscriptionService}
              className="flex items-center gap-2"
            >
              {loadingTranscriptionService ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {t("selectMeeting.connecting")}
                </>
              ) : (
                t("startCopilot")
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={onLeave}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 h-[calc(100vh-64px)]">
        {/* Left Panel - Meeting Display & Transcription */}
        <div className="w-1/2 flex flex-col">
          {/* Video Area */}
          <div className="h-[50vh] bg-black relative flex items-center justify-center">
            <div
              className={`absolute inset-0 flex items-center justify-center ${
                !isSelectingMeeting ? "hidden" : ""
              }`}
            >
              <div className="text-center">
                <h2 className="text-white text-xl mb-4">
                  {t("selectMeeting.title")}
                </h2>
                <Button
                  variant="secondary"
                  onClick={handleSelectMeeting}
                  disabled={isLoading}
                >
                  <MonitorUp className="mr-2 h-4 w-4" />
                  {isLoading
                    ? t("selectMeeting.connecting")
                    : t("selectMeeting.button")}
                </Button>
              </div>
            </div>

            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`h-full w-auto object-contain ${
                isSelectingMeeting ? "hidden" : ""
              }`}
            />
          </div>

          {/* Transcription Area */}
          <div className="flex-1 border-t flex flex-col min-h-0">
            <div className="p-4 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-medium">{t("transcription.title")}</h2>
                {isTranscribing && (
                  <Badge variant="destructive">
                    {t("transcription.status.transcribing")}
                  </Badge>
                )}
              </div>
              <div
                ref={transcriptRef}
                className="flex-1 overflow-y-auto min-h-0 px-1"
              >
                <div className="text-gray-600 dark:text-gray-300 text-sm space-y-3">
                  {isTranscribing ? (
                    <div className="space-y-3">
                      {transcript.map(
                        (sentences, paragraphIndex) =>
                          sentences.length > 0 && (
                            <div
                              key={paragraphIndex}
                              className="p-3 bg-gray-50 dark:bg-gray-800 
                              border border-gray-100 dark:border-gray-700 rounded-lg"
                            >
                              {sentences.map((sentence, sentenceIndex) => (
                                <span key={sentenceIndex}>
                                  {sentence}
                                  {sentenceIndex < sentences.length - 1
                                    ? " "
                                    : ""}
                                </span>
                              ))}
                            </div>
                          )
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      {t("selectMeeting.instruction")}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Copilot */}
        <div className="w-1/2 border-l">
          <div className="h-full flex flex-col p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-medium">{t("copilot.title")}</h2>
              {isTranscribing && <Badge>{t("copilot.status.listening")}</Badge>}
            </div>
            <div ref={copilotRef} className="flex-1 overflow-y-auto px-1">
              {isTranscribing ? (
                <div className="space-y-4">
                  {questionsWithAnswers.map((q, index) => (
                    <div
                      key={index}
                      className="p-4 bg-blue-50 dark:bg-gray-800
                        border border-blue-100 dark:border-gray-700 rounded-lg"
                    >
                      <div className="font-medium text-lg text-gray-900 dark:text-white mb-2">
                        {q.question}
                      </div>
                      {q.answer ? (
                        <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
                          {q.answer}
                        </div>
                      ) : (
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-600 dark:text-gray-300">
                  {t("copilot.waitingMessage")}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
