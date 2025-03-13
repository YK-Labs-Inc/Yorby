import { UploadResponse } from "@/utils/types";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { Loader2, Monitor } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Link } from "@/i18n/routing";

export default function InterviewCopilotDemoSession({
  uploadResponse,
  signedUrl,
}: {
  uploadResponse: UploadResponse | null;
  signedUrl: string;
}) {
  const [hasStarted, setHasStarted] = useState(false);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const t = useTranslations("interviewCopilots.session");
  const demoT = useTranslations("interviewCopilotDemo");
  const { logError } = useAxiomLogging();
  const [transcript, setTranscript] = useState<string[]>([]);
  const askedQuestionsRef = useRef<Set<number>>(new Set());
  const [questionsWithAnswers, setQuestionsWithAnswers] = useState<
    {
      question: string;
      answer: string;
    }[]
  >([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const copilotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasStarted) return;

    if (videoRef.current) {
      videoRef.current.play();
      videoRef.current.addEventListener("ended", stopTranscription);
    }

    const transcriptWithTimings = [
      // First paragraph (0-22 seconds)
      {
        text: "Hi there, thanks for trying out Perfect Interview's interview co-pilot feature.",
        timing: 4500,
      },
      {
        text: "This will be a practice job interview so you can see how the interview co-pilot feature works.",
        timing: 9500,
      },
      {
        text: "You will notice that as I ask interview questions, the interview co-pilot will automatically detect the questions that I am asking in real time and generate an answer for you based off whatever documents you uploaded into the interview co-pilot.",
        timing: 22000,
      },

      // Second paragraph (24-26.5 seconds)
      { text: "Let's start with a brief introduction.", timing: 24000 },
      { text: "Can you tell me a little bit about yourself?", timing: 26500 },

      // Third paragraph (33.5-38 seconds)
      { text: "Great, nice to meet you.", timing: 33500 },
      {
        text: "Could you now tell me a little bit about your previous work experience?",
        timing: 38000,
      },

      // Fourth paragraph (44-53 seconds)
      { text: "That sounds very interesting.", timing: 44000 },
      {
        text: "Could you provide a little bit more detail on your previous work experience?",
        timing: 48000,
      },
      {
        text: "I'd love to hear a little bit more details about your most recent job experience.",
        timing: 53000,
      },

      // Final paragraph (60-62 seconds)
      {
        text: "That concludes the demo of the interview co-pilot feature.",
        timing: 60000,
      },
      { text: "Good luck on your next interview!", timing: 62000 },
    ];

    // Initialize transcript array with empty strings for each paragraph
    setTranscript(new Array(5).fill(""));

    transcriptWithTimings.forEach(({ text, timing }) => {
      setTimeout(
        () => {
          setTranscript((prev) => {
            const newTranscript = [...prev];

            // Determine which paragraph this sentence belongs to
            let paragraphIndex = 0;
            if (timing >= 24000 && timing < 33500) {
              paragraphIndex = 1;
            } else if (timing >= 33500 && timing < 44000) {
              paragraphIndex = 2;
            } else if (timing >= 44000 && timing < 53000) {
              paragraphIndex = 3;
            } else if (timing >= 53000 && timing < 62000) {
              paragraphIndex = 4;
            }

            // Append the new sentence to the existing paragraph
            newTranscript[paragraphIndex] = newTranscript[paragraphIndex]
              ? `${newTranscript[paragraphIndex]} ${text}`
              : text;

            if (text === "Can you tell me a little bit about yourself?") {
              if (!askedQuestionsRef.current.has(1)) {
                askedQuestionsRef.current.add(1);
                processQuestion(text);
              }
            } else if (
              text ===
              "Could you now tell me a little bit about your previous work experience?"
            ) {
              if (!askedQuestionsRef.current.has(2)) {
                askedQuestionsRef.current.add(2);
                processQuestion(text);
              }
            } else if (
              text ===
              "I'd love to hear a little bit more details about your most recent job experience."
            ) {
              if (!askedQuestionsRef.current.has(3)) {
                askedQuestionsRef.current.add(3);
                processQuestion(text);
              }
            }
            return newTranscript;
          });
        },
        timing + Math.random() * 500 + 500
      );
    });

    return () => {
      if (videoRef.current) {
        videoRef.current.removeEventListener("ended", stopTranscription);
      }
    };
  }, [hasStarted]);

  const startSession = () => {
    setHasStarted(true);
  };

  const processQuestion = async (question: string) => {
    setQuestionsWithAnswers((prev) => [...prev, { question, answer: "" }]);

    try {
      const response = await fetch(
        "/api/interview-copilot-demo-answer-question",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question,
            uploadResponse,
          }),
        }
      );

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
        // Do nothing
        if (done) {
          break;
        }
        const textChunk = new TextDecoder().decode(value);
        accumulatedResponse += textChunk;
        setQuestionsWithAnswers((prev) =>
          prev.map((q) =>
            q.question === question ? { ...q, answer: accumulatedResponse } : q
          )
        );
      }
    } catch (error) {
      logError("Error processing question", { error });
      setQuestionsWithAnswers((prev) =>
        prev.filter((q) => q.question !== question)
      );
    }
  };

  const stopTranscription = async () => {
    setShowEndDialog(true);
  };

  // Remove the old auto-scroll effect
  useEffect(() => {
    const handleAutoScroll = (element: HTMLDivElement | null) => {
      if (!element) return;

      element.scrollTo({
        top: element.scrollHeight,
        behavior: "smooth",
      });
    };

    // Handle auto-scrolling for both panels
    handleAutoScroll(transcriptRef.current);
    handleAutoScroll(copilotRef.current);

    // Cleanup
  }, [transcript, questionsWithAnswers]);

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-medium">
            {demoT("session.title") || "Interview Co-pilot Demo"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={startSession}
            disabled={hasStarted}
            className="ml-4"
            variant="outline"
          >
            {demoT("session.cta") || "Start Interview Copilot"}
          </Button>
          <Link href="/sign-in" className="w-full">
            <Button>
              {demoT("session.createYourOwnInterviewCopilot") ||
                "Create Your Own Interview Copilot"}
            </Button>
          </Link>
        </div>
      </header>

      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{demoT("endDialog.title")}</DialogTitle>
            <DialogDescription className="space-y-4">
              {demoT("endDialog.callToAction")}
            </DialogDescription>
          </DialogHeader>
          <Link className="w-full" href="/sign-in">
            <Button className="w-full">{demoT("endDialog.button")}</Button>
          </Link>
        </DialogContent>
      </Dialog>

      <div className="flex flex-1 h-[calc(100vh-64px)]">
        <div className="w-1/2 flex flex-col">
          <div className="h-[50vh] bg-black relative flex items-center justify-center">
            <video
              ref={videoRef}
              playsInline
              src={signedUrl}
              className="h-full w-auto object-contain"
            />
          </div>

          <div className="flex-1 border-t flex flex-col min-h-0">
            <div className="p-4 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-medium">{t("transcription.title")}</h2>
                <Badge variant="destructive">
                  {t("transcription.status.transcribing")}
                </Badge>
              </div>
              <div
                ref={transcriptRef}
                className="flex-1 overflow-y-auto min-h-0 px-1 space-y-3"
              >
                <div className="text-gray-600 dark:text-gray-300 text-sm space-y-3">
                  <div className="space-y-3">
                    {transcript.map(
                      (sentences, paragraphIndex) =>
                        sentences && (
                          <div
                            key={paragraphIndex}
                            className="p-3 bg-gray-50 dark:bg-gray-800 
                            border border-gray-100 dark:border-gray-700 rounded-lg"
                          >
                            <p>{sentences}</p>
                          </div>
                        )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-1/2 border-l">
          <div className="h-full flex flex-col p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-medium">{t("copilot.title")}</h2>
              <Badge>{t("copilot.status.listening")}</Badge>
            </div>
            <div
              ref={copilotRef}
              className="flex-1 overflow-y-auto px-1 space-y-4"
            >
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
                      <div className="text-gray-700 dark:text-gray-300 leading-relaxed prose dark:prose-invert max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {q.answer}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
