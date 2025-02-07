"use client";

import { useState, useRef, useEffect } from "react";
import { MonitorUp, LogOut, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { RealtimeTranscriber } from "assemblyai";
import { answerQuestion, detectQuestions } from "../actions";

export function Session({
  temporaryToken,
  interviewCopilotId,
}: {
  temporaryToken: string;
  interviewCopilotId: string;
}) {
  const t = useTranslations("interviewCopilots.session");
  const [isSelectingMeeting, setIsSelectingMeeting] = useState(true);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTranscriptionService, setLoadingTranscriptionService] =
    useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [inputTokenCount, setInputTokenCount] = useState(0);
  const [outputTokenCount, setOutputTokenCount] = useState(0);
  const contextBufferAmount = 3;
  const [questionsWithAnswers, setQuestionsWithAnswers] = useState<
    {
      question: string;
      answer: string;
    }[]
  >([]);
  const latestQuestionsWithAnswersRef = useRef(questionsWithAnswers);
  const [transcriptionSessionEnded, setTranscriptionSessionEnded] =
    useState(false);
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const copilotRef = useRef<HTMLDivElement>(null);
  const { logError } = useAxiomLogging();
  const socketRef = useRef<RealtimeTranscriber>(null);
  const transcriptIndexRef = useRef(0);
  const latestTranscriptRef = useRef<string[]>(transcript);
  const audioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Function to convert Float32Array to Int16Array
  const convertToInt16 = (float32Array: Float32Array): Int16Array => {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return int16Array;
  };

  // Auto-scroll effect for both panels
  useEffect(() => {
    if (!autoScroll) return;

    const scrollToBottom = (element: HTMLDivElement | null) => {
      if (element) {
        const isAtBottom =
          element.scrollHeight - element.clientHeight <=
          element.scrollTop + 100;
        if (isAtBottom) {
          element.scrollTo({
            top: element.scrollHeight,
            behavior: "smooth",
          });
        }
      }
    };

    scrollToBottom(transcriptRef.current);
    scrollToBottom(copilotRef.current);
  }, [transcript, autoScroll]);

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
      const realtimeService = new RealtimeTranscriber({
        token: temporaryToken,
        sampleRate: 16000,
        endUtteranceSilenceThreshold: 1000,
      });

      realtimeService.on("open", () => {
        setLoadingTranscriptionService(false);
        setIsTranscribing(true);

        const audioStream = new MediaStream(stream.getAudioTracks());

        // Create AudioContext with correct sample rate for AssemblyAI
        const audioContext = new AudioContext({
          sampleRate: 16000, // Required sample rate
          latencyHint: "interactive",
        });
        audioContextRef.current = audioContext;

        const source = audioContext.createMediaStreamSource(audioStream);

        // Using 8192 samples at 16kHz is about 512ms
        // This is well within AssemblyAI's requirement of 100-2000ms
        // and should provide better performance than smaller chunks
        const BUFFER_SIZE = 8192;

        // Create ScriptProcessor with valid buffer size
        const processor = audioContext.createScriptProcessor(BUFFER_SIZE, 1, 1);
        scriptProcessorRef.current = processor;

        processor.onaudioprocess = (e) => {
          // Get input data from first (and only) channel
          const inputData = e.inputBuffer.getChannelData(0);

          // Convert Float32 samples to Int16 samples
          const pcm16Data = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            // Clamp samples to [-1, 1] range
            const sample = Math.max(-1, Math.min(1, inputData[i]));
            // Convert to 16-bit integer
            pcm16Data[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
          }

          try {
            // Send the PCM16 buffer to AssemblyAI
            // Each buffer is ~512ms of audio at 16kHz sample rate
            realtimeService.sendAudio(pcm16Data.buffer);
          } catch (error) {
            console.error("Error sending audio data:", error);
          }
        };

        // Connect the audio pipeline
        source.connect(processor);
        processor.connect(audioContext.destination);
      });

      realtimeService.on("transcript", (transcript) => {
        // console.log("transcript", transcript);
        if (transcript.message_type === "FinalTranscript") {
          const currentIndex = transcriptIndexRef.current;
          transcriptIndexRef.current += 1;
          setTranscript((prev) => {
            const updated = [...prev];
            updated[currentIndex] = transcript.text;
            return updated;
          });
          processTranscript(transcript.text);
        } else if (transcript.message_type === "PartialTranscript") {
          setTranscript((prev) => {
            const updated = [...prev];
            if (updated.length <= transcriptIndexRef.current) {
              updated.push(""); // Ensure we have a slot for the current index
            }
            updated[transcriptIndexRef.current] = transcript.text;
            return updated;
          });
        }
      });

      realtimeService.on("error", (error) => {
        logError("AssemblyAI error", { error: error.message });
      });

      realtimeService.on("close", () => {
        setTranscriptionSessionEnded(true);
      });

      realtimeService.connect();
      socketRef.current = realtimeService;
    } catch (error) {
      logError("Error starting transcription:", { error });
      setIsTranscribing(false);
    }
  };

  const stopTranscription = () => {
    if (socketRef.current) {
      socketRef.current.close();
      setIsTranscribing(false);
    }

    // Clean up audio processing
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Clean up media recorder
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
  };

  const onLeave = () => {
    console.log("Leaving session");
  };

  useEffect(() => {
    latestTranscriptRef.current = transcript;
  }, [transcript]);

  useEffect(() => {
    latestQuestionsWithAnswersRef.current = questionsWithAnswers;
  }, [questionsWithAnswers]);

  const processTranscript = async (transcript: string) => {
    const questions = await detectQuestionsFromTranscript(transcript);
    questions.forEach((question) => {
      processQuestion(question);
    });
  };

  const detectQuestionsFromTranscript = async (transcript: string) => {
    let contextBuffer = "";
    if (transcriptIndexRef.current > 0) {
      const startIndex = Math.max(
        0,
        transcriptIndexRef.current - contextBufferAmount
      );
      if (startIndex !== transcriptIndexRef.current) {
        const previousText = latestTranscriptRef.current
          .slice(startIndex, transcriptIndexRef.current)
          .join("\n");
        contextBuffer = previousText + "\n";
      }
    }

    const textToProcess = contextBuffer + transcript;
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
    setInputTokenCount((prev) => prev + inputTokenCount);
    setOutputTokenCount((prev) => prev + outputTokenCount);
    return questions;
  };

  const processQuestion = async (question: string) => {
    setQuestionsWithAnswers((prev) => [...prev, { question, answer: "" }]);
    const formData = new FormData();
    formData.append("interviewCopilotId", interviewCopilotId);
    formData.append("question", question);
    const answerQuestionResponse = await answerQuestion(formData);
    const {
      data: answer,
      inputTokenCount,
      outputTokenCount,
    } = answerQuestionResponse;
    setInputTokenCount((prev) => prev + inputTokenCount);
    setOutputTokenCount((prev) => prev + outputTokenCount);
    if (answer) {
      setQuestionsWithAnswers((prev) =>
        prev.map((q) => (q.question === question ? { ...q, answer } : q))
      );
    } else {
      setQuestionsWithAnswers((prev) =>
        prev.filter((q) => q.question !== question)
      );
    }
  };

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-6 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {t("controls.autoScroll")}
          </span>
          <Button
            variant="outline"
            size="sm"
            className={autoScroll ? "bg-blue-50 text-blue-600" : ""}
            onClick={() => setAutoScroll(!autoScroll)}
          >
            {autoScroll ? "On" : "Off"}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {isTranscribing ? (
            <Button variant="destructive" onClick={stopTranscription}>
              {t("stopRecording")}
            </Button>
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
              </div>
              <div
                ref={transcriptRef}
                className="flex-1 overflow-y-auto min-h-0 px-1"
              >
                <div className="text-gray-600 dark:text-gray-300 text-sm space-y-3">
                  {isTranscribing ? (
                    <div className="space-y-3">
                      {transcript.map((t, index) => (
                        <div
                          key={index}
                          className="p-3 bg-gray-50 dark:bg-gray-800 
                            border border-gray-100 dark:border-gray-700 rounded-lg"
                        >
                          {t}
                        </div>
                      ))}
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
                      <div className="font-medium text-xl text-gray-900 dark:text-white mb-2">
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
