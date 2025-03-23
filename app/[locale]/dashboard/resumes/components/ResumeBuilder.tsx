"use client";

import {
  useState,
  useEffect,
  useRef,
  useActionState,
  useCallback,
  useTransition,
} from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import ResumePreview from "./ResumePreview";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, Send, Lock, PlayCircle, Volume2, VolumeX } from "lucide-react";
import { useVoiceRecording } from "./useVoiceRecording";
import VoiceRecordingOverlay from "./VoiceRecordingOverlay";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { Tables } from "@/utils/supabase/database.types";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import remarkGfm from "remark-gfm";
import ReactMarkdown from "react-markdown";
import { FormMessage, Message } from "@/components/form-message";
import { Link } from "@/i18n/routing";
import {
  saveResume,
  unlockResume,
  trackResumeEdit,
  getResumeEditCount,
  verifyAnonymousUser,
} from "../actions";
import { User } from "@supabase/supabase-js";
import { linkAnonymousAccount } from "@/components/auth/actions";
import { SubmitButton } from "@/components/submit-button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CoreAssistantMessage, CoreMessage } from "ai";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import * as Sentry from "@sentry/nextjs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Turnstile } from "@marsidev/react-turnstile";
import MobileWarning from "./MobileWarning";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type ResumeDataType = Tables<"resumes"> & {
  resume_sections: (Tables<"resume_sections"> & {
    resume_list_items: Tables<"resume_list_items">[];
    resume_detail_items: (Tables<"resume_detail_items"> & {
      resume_item_descriptions: Tables<"resume_item_descriptions">[];
    })[];
  })[];
};

interface VoiceOption {
  voiceId: string;
  title: string;
  provider: "openai" | "speechify";
  speakingStyle?: string;
}

const VOICE_OPTIONS: VoiceOption[] = [
  {
    voiceId: "alloy",
    title: "Alloy",
    provider: "openai",
  },
  {
    voiceId: "onyx",
    title: "Onyx",
    provider: "openai",
  },
  {
    voiceId: "lbj",
    title: "LeBron James",
    provider: "speechify",
    speakingStyle: `
    Rewrite the text in a style of a middle age (30-40) year old black man who is a world famous
    basketball player and is known for using a lot of AAVE and slang. He likes to talk with
    a lot of wisdom and life lessons as he is the world's greatest basketball player.

    Use your knowledge of LeBron James to make sure the text is written in a way that is true to his personality.

    However, do not make the text overly wordy compared to the original text. Try your best to keep the transformed
    text length to be in the same general length as the original text.
     `,
  },
];

const LockedResumeOverlay = ({ resumeId }: { resumeId: string }) => {
  const t = useTranslations("resumeBuilder");
  const [
    linkAnonymousAccountState,
    linkAnonymousAccountAction,
    linkAnonymousAccountPending,
  ] = useActionState(linkAnonymousAccount, { error: "" });

  let linkAnonymousAccountMessage: Message | undefined;
  if (linkAnonymousAccountState?.error) {
    linkAnonymousAccountMessage = { error: linkAnonymousAccountState.error };
  } else if (linkAnonymousAccountState?.success) {
    linkAnonymousAccountMessage = {
      success: linkAnonymousAccountState.success,
    };
  }

  return (
    <div className="relative flex-grow overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-md shadow-sm border h-full">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="p-6 flex flex-col items-center justify-center space-y-6 text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center backdrop-blur-md">
            <Lock className="w-8 h-8 text-gray-500 dark:text-gray-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t("locked.title")}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {t("locked.descriptionEmailForm")}
            </p>
          </div>
          <div className="md mx-auto w-full text-left">
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-2">{t("form.title")}</h2>
              <p className="text-muted-foreground mb-6">
                {t("form.description")}
              </p>
              <form action={linkAnonymousAccountAction} className="space-y-4">
                <Label htmlFor="email">{t("form.email.label")}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={t("form.email.placeholder")}
                  required
                />
                <input
                  type="hidden"
                  name="redirectTo"
                  value={`/dashboard/resumes/${resumeId}`}
                />
                <SubmitButton disabled={linkAnonymousAccountPending}>
                  {linkAnonymousAccountPending
                    ? t("form.pending")
                    : t("form.submit")}
                </SubmitButton>
              </form>
            </div>
            {linkAnonymousAccountMessage && (
              <FormMessage message={linkAnonymousAccountMessage} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ResumeBuilder({
  resumeId,
  hasSubscription,
  credits,
  user,
  isSubscriptionVariant,
  isFreemiumEnabled,
}: {
  resumeId?: string;
  hasSubscription: boolean;
  credits: number;
  user: User | null;
  isSubscriptionVariant: boolean;
  isFreemiumEnabled: boolean;
}) {
  const t = useTranslations("resumeBuilder");
  const [isDemoDismissed, setIsDemoDismissed] = useState<boolean>(false);
  const [isMobileView, setIsMobileView] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [textInput, setTextInput] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isInterviewing, setIsInterviewing] = useState<boolean>(false);
  const [messages, setMessages] = useState<CoreMessage[]>([]);
  const [resume, setResume] = useState<ResumeDataType | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { logError } = useAxiomLogging();
  const router = useRouter();
  const [editCount, setEditCount] = useState<number>(0);
  const [showLimitDialog, setShowLimitDialog] = useState<boolean>(false);
  const MAX_FREE_EDITS = 2;
  const [unlockState, unlockAction, unlockPending] = useActionState(
    unlockResume,
    {
      error: "",
    }
  );
  const [verifyAnonymousUserState, verifyAnonymousUserAction] = useActionState(
    verifyAnonymousUser,
    {
      error: "",
    }
  );
  const [_, startTransition] = useTransition();
  const [captchaToken, setCaptchaToken] = useState<string>("");
  const pathname = usePathname();
  const showDemoCTA = pathname.includes("/dashboard/resumes");

  // Add new state for text-to-speech
  const [isTtsEnabled, setIsTtsEnabled] = useState<boolean>(false);
  const [selectedVoice, setSelectedVoice] = useState<string>("alloy");
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      const isMobileView = window.innerWidth < 768; // 768px is the standard md breakpoint
      setIsMobileView(isMobileView);
    };

    // Check on mount
    checkMobile();

    // Add resize listener
    window.addEventListener("resize", checkMobile);

    // Cleanup
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Handle unlock success
  useEffect(() => {
    if (unlockState?.success && resumeId) {
      setShowLimitDialog(false);
      fetchResumeData(resumeId);
    }
  }, [unlockState?.success, resumeId]);

  // Add useEffect to handle playback speed changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  const shouldShowSplitView = resumeId || isGenerating;
  const isLocked = Boolean(
    resume && resume?.locked_status === "locked" && !hasSubscription
  );
  const hasReachedFreemiumLimit = editCount >= MAX_FREE_EDITS;

  // Initialize the conversation with the first AI message
  useEffect(() => {
    if (resumeId) {
      setMessages([
        {
          role: "assistant",
          content: t("editResumeInitialMessage"),
        },
      ]);
    } else {
      setMessages([
        {
          role: "assistant",
          content: t("createResumeInitialMessage"),
        },
      ]);
    }
  }, [resumeId]);

  // Fetch initial edit count
  useEffect(() => {
    if (resumeId && isFreemiumEnabled) {
      getResumeEditCount(resumeId).then((count) => setEditCount(count));
    }
  }, [resumeId, isFreemiumEnabled]);

  const fetchResumeData = useCallback(
    async (resumeId: string) => {
      setIsGenerating(true);
      try {
        const supabase = createSupabaseBrowserClient();

        // Fetch basic resume data
        const { data, error } = await supabase
          .from("resumes")
          .select(
            `*, 
              resume_sections(
                *, 
                resume_list_items(*), 
                resume_detail_items(
                  *,
                  resume_item_descriptions(*))
              )`
          )
          .eq("id", resumeId)
          .single();

        if (error || !data) {
          throw new Error(error?.message || "Resume not found");
        }

        // Sort all nested arrays by display_order
        const sortedData = {
          ...data,
          resume_sections: data.resume_sections
            .sort((a, b) => a.display_order - b.display_order)
            .map((section) => ({
              ...section,
              resume_list_items: section.resume_list_items.sort(
                (a, b) => a.display_order - b.display_order
              ),
              resume_detail_items: section.resume_detail_items
                .sort((a, b) => a.display_order - b.display_order)
                .map((detailItem) => ({
                  ...detailItem,
                  resume_item_descriptions:
                    detailItem.resume_item_descriptions.sort(
                      (a, b) => a.display_order - b.display_order
                    ),
                })),
            })),
        };

        setResume(sortedData);
      } catch (error) {
        console.error("Error fetching resume data:", error);
        setResume(null);
      } finally {
        setIsGenerating(false);
      }
    },
    [resumeId]
  );

  useEffect(() => {
    // If resumeId is provided, fetch the resume data
    if (resumeId) {
      fetchResumeData(resumeId);
    }
  }, [resumeId]);

  // Scroll to bottom of chat whenever messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const {
    startRecording,
    stopRecording,
    cancelRecording,
    isProcessing,
    audioDevices,
    selectedAudio,
    setSelectedAudio,
  } = useVoiceRecording({
    onTranscription: (transcription: string) => {
      if (transcription.trim()) {
        setTextInput(transcription);
        setIsRecording(false);
      }
    },
    t,
  });

  const stopAudioPlayback = useCallback(() => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    } catch (e) {
      console.error("Error in stopAudioPlayback:", e);
    } finally {
      setIsPlaying(false);
    }
  }, []);

  const handleRecordingToggle = async () => {
    // Stop any playing audio when starting to record
    stopAudioPlayback();

    if (isRecording) {
      stopRecording();
      setIsRecording(false);
    } else {
      try {
        // Start recording, using the microphone directly
        await startRecording();
        setIsRecording(true);
      } catch (error) {
        console.error("Failed to start recording:", error);
        logError("Voice recording toggle error:", { error });
      }
    }
  };

  const handleTextInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextInput(e.target.value);
  };

  const transformText = async (text: string): Promise<string> => {
    // Find the selected voice option
    const selectedVoiceOption = VOICE_OPTIONS.find(
      (voice) => voice.voiceId === selectedVoice
    );
    if (!selectedVoiceOption) {
      throw new Error("Selected voice not found");
    }

    // Return original text if no speaking style
    if (!selectedVoiceOption.speakingStyle) {
      return text;
    }

    try {
      const transformResponse = await fetch("/api/transform-text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          speakingStyle: selectedVoiceOption.speakingStyle,
        }),
      });

      if (!transformResponse.ok) {
        logError(`Failed to transform text: ${transformResponse.statusText}`);
        return text;
      }

      const { transformedText } = await transformResponse.json();
      return transformedText;
    } catch (error) {
      logError("Text transformation error:", { error });
      return text;
    }
  };

  const speakMessage = async (text: string) => {
    if (!isTtsEnabled || isPlaying) return;

    try {
      setIsPlaying(true);

      // Create a new audio element if it doesn't exist
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }

      const audio = audioRef.current;
      audio.playbackRate = playbackSpeed;

      // Clean up previous audio
      audio.pause();
      if (audio.src) {
        URL.revokeObjectURL(audio.src);
      }

      // Set up audio event handlers
      audio.onended = () => {
        setIsPlaying(false);
        if (audio.src) {
          URL.revokeObjectURL(audio.src);
        }
      };

      audio.onerror = (e) => {
        logError("Audio playback error:", { error: e });
        setIsPlaying(false);
        if (audio.src) {
          URL.revokeObjectURL(audio.src);
        }
      };

      // Find the selected voice option
      const selectedVoiceOption = VOICE_OPTIONS.find(
        (voice) => voice.voiceId === selectedVoice
      );
      if (!selectedVoiceOption) {
        throw new Error("Selected voice not found");
      }

      // Fetch audio
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          voiceId: selectedVoiceOption.voiceId,
          provider: selectedVoiceOption.provider,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate speech: ${response.statusText}`);
      }

      // Create blob from response and set as audio source
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      audio.src = url;
      await audio.play();
    } catch (error) {
      logError("TTS Error:", { error });
      alert("Sorry, something went wrong. Please try again.");
      setIsPlaying(false);
    }
  };

  // Update the messages state setter to include TTS
  const addMessageWithTTS = useCallback(
    async (messageToTranscribe: string) => {
      const transformedText = await transformText(messageToTranscribe);
      await speakMessage(transformedText);
      setMessages((prev) => [...prev.slice(0, -1)]);
      const aiMessage: CoreAssistantMessage = {
        role: "assistant",
        content: transformedText,
      };
      setMessages((prev) => [...prev, aiMessage]);
    },
    [isTtsEnabled, selectedVoice, isPlaying]
  );

  const sendInterviewMessage = async (
    transcription?: string,
    retryCount = 0
  ) => {
    const messageContent = transcription || textInput;
    if (!messageContent.trim() || isGenerating) return;

    // Add user message to chat
    const updatedMessages: CoreMessage[] = [
      ...messages,
      {
        role: "user",
        content: messageContent,
      },
    ];

    setMessages(updatedMessages);
    setTextInput("");

    // Add a temporary message to indicate AI is thinking
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: "",
        isLoading: true,
      },
    ]);

    try {
      // Send to backend for processing
      const response = await fetch("/api/resume/interview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      // Parse the JSON response
      const data = await response.json();
      const { interviewIsComplete, interviewerResponse } = data;

      if (isTtsEnabled) {
        await addMessageWithTTS(interviewerResponse);
      } else {
        setMessages((prev) => prev.slice(0, -1));
        const aiMessage: CoreAssistantMessage = {
          role: "assistant",
          content: interviewerResponse,
        };
        setMessages((prev) => [...prev, aiMessage]);
      }

      // If interview is complete, set resume as ready and generate it
      if (interviewIsComplete) {
        generateResume([...updatedMessages]);
      }
    } catch (error) {
      logError("Error in AI resume conversation:", { error });

      // Remove the temporary loading message
      setMessages((prev) => prev.slice(0, -1));

      if (retryCount < 2) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: t("errors.resumeGenerationRetryMessage"),
          },
        ]);
        return sendInterviewMessage(messageContent, retryCount + 1);
      }

      // Update the last message to show the error
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: t("errors.resumeGenerationError"),
        },
      ]);
      Sentry.captureException(error);
    }
  };

  const sendEditMessage = async (retryCount = 0) => {
    if (!resumeId) {
      logError("No resume found");
      throw new Error("No resume found");
    }
    const messageContent = textInput.trim();

    const updatedMessages: CoreMessage[] = [
      ...messages,
      {
        role: "user",
        content: messageContent,
      },
    ];

    setMessages(updatedMessages);
    setTextInput("");

    // Add a temporary message to indicate AI is thinking
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: "",
        isLoading: true,
      },
    ]);

    try {
      const response = await fetch("/api/resume/edit", {
        method: "POST",
        body: JSON.stringify({
          resume: resume,
          userMessage: messageContent,
        }),
      });

      if (response.status === 429) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant" as const,
            content:
              t("errors.rateLimitMessage") ||
              "You've been rate limited — please try again in an hour.",
          },
        ]);
        return;
      } else if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      const { updatedResume, aiResponse } = data;
      if (isTtsEnabled) {
        await addMessageWithTTS(aiResponse);
      } else {
        setMessages((prev) => prev.slice(0, -1));
        const aiMessage: CoreAssistantMessage = {
          role: "assistant",
          content: aiResponse,
        };
        setMessages((prev) => [...prev, aiMessage]);
      }
      setResume(updatedResume);
      void saveResume(updatedResume, resumeId);
    } catch (error) {
      // Remove the temporary loading message
      setMessages((prev) => prev.slice(0, -1));

      if (retryCount < 2) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: t("errors.resumeGenerationRetryMessage"),
          },
        ]);
        return sendEditMessage(retryCount + 1);
      }

      const aiMessage: CoreAssistantMessage = {
        role: "assistant",
        content: t("errors.resumeEditError"),
      };

      setMessages((prev) => [...prev, aiMessage]);
      Sentry.captureException(error);
    }
  };

  const handleSendButtonClick = () => {
    sendMessage();
  };

  const sendMessage = async () => {
    stopAudioPlayback();

    if (isLocked && isFreemiumEnabled && hasReachedFreemiumLimit) {
      setShowLimitDialog(true);
      return;
    }

    if (resumeId) {
      setIsGenerating(true);
      await sendEditMessage();
      if (isFreemiumEnabled && !hasSubscription) {
        await trackResumeEdit(resumeId);
        setEditCount((prev) => prev + 1);
      }
      setIsGenerating(false);
    } else {
      setIsInterviewing(true);
      await sendInterviewMessage();
      setIsInterviewing(false);
    }

    if (!user && captchaToken) {
      const formData = new FormData();
      formData.set("captchaToken", captchaToken);
      formData.set("currentPath", pathname);
      startTransition(() => {
        verifyAnonymousUserAction(formData);
      });
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const generateResume = async (
    conversationHistory: CoreMessage[],
    retryCount = 0
  ) => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/resume/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: conversationHistory,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const { resumeId, error } = (await response.json()) as {
        resumeId?: string;
        error?: string;
      };
      if (error) {
        throw error;
      }
      if (!resumeId) {
        throw new Error("No resume ID returned from server");
      }
      router.replace(`/dashboard/resumes/${resumeId}`);
    } catch (error) {
      logError("Error generating resume:", { error });

      if (retryCount < 2) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: t("errors.resumeGenerationRetryMessage"),
          },
        ]);
        return generateResume(conversationHistory, retryCount + 1);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: t("errors.resumeGenerationError"),
        },
      ]);
      setIsGenerating(false);
      Sentry.captureException(error);
    }
  };

  // If user is not anonymous (has email) and is on mobile, only show mobile warning
  if (isMobileView && user && !user.is_anonymous) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <MobileWarning />
      </div>
    );
  }

  // Also update the cleanup effect to use the new function
  useEffect(() => {
    return () => {
      stopAudioPlayback();
    };
  }, [stopAudioPlayback]);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {!resume && messages.length === 1 && !isDemoDismissed && showDemoCTA && (
        <Card className="mx-12 my-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50">
          <CardContent className="px-6 py-8 relative">
            <button
              onClick={() => setIsDemoDismissed(true)}
              className="absolute top-2 right-2 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Close demo card"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground">
                  {t("demoTitle")}
                </h2>
                <p className="text-muted-foreground max-w-lg">
                  {t("demoDescription")}
                </p>
              </div>
              <Link href="/resume-builder-demo" className="shrink-0">
                <Button size="lg" className="gap-2">
                  <PlayCircle className="w-5 h-5" />
                  {t("demoCta")}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
      {verifyAnonymousUserState?.error && (
        <FormMessage message={{ error: verifyAnonymousUserState.error }} />
      )}
      <div
        className={`flex-1 grid ${
          shouldShowSplitView ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
        } gap-8 p-8 overflow-hidden max-w-[2000px] mx-auto w-full h-full`}
      >
        {/* Chat UI column - always shown */}
        <div
          className={`md:flex flex-col h-full overflow-hidden ${
            shouldShowSplitView ? "" : "lg:col-span-2 max-w-3xl mx-auto w-full"
          } ${user?.is_anonymous ? "hidden" : ""}`}
        >
          {/* Title Section */}
          {!shouldShowSplitView && (
            <div className="flex-none mb-4 space-y-1">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white text-center">
                {t("titleV2")}
              </h1>
              <p className="text-lg text-gray-500 dark:text-gray-400 text-center">
                {t("descriptionV2")}
              </p>
            </div>
          )}

          <Card className="flex-1 bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg flex flex-col border-0 transition-all duration-300 overflow-hidden min-h-0">
            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto space-y-6 p-4 rounded-xl custom-scrollbar min-h-0">
              <AnimatePresence>
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl p-4 shadow-sm transition-all duration-300 ${
                        message.role === "user"
                          ? "bg-gray-900 text-white dark:bg-gray-700 transform hover:scale-[1.02]"
                          : "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 transform hover:scale-[1.02]"
                      }`}
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex-grow">
                          {(message as any).isLoading ? (
                            <div className="flex items-center justify-center">
                              <LoadingSpinner variant="muted" />
                            </div>
                          ) : (
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {message.content as string}
                            </ReactMarkdown>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            <div className="w-full relative">
              <AnimatePresence>
                {isRecording ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                  >
                    <VoiceRecordingOverlay
                      isOpen={true}
                      onClose={() => {
                        cancelRecording();
                        setIsRecording(false);
                      }}
                      onConfirm={() => {
                        stopRecording();
                        setIsRecording(false);
                      }}
                      audioDevices={audioDevices}
                      selectedAudio={selectedAudio}
                      onSelectAudio={(deviceId) => setSelectedAudio(deviceId)}
                    />
                  </motion.div>
                ) : isProcessing ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full p-6 rounded-xl border dark:bg-gray-800/50 dark:border-gray-700 bg-white/50 flex items-center justify-center"
                  >
                    <div className="flex flex-col items-center space-y-3">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-800 dark:border-gray-700 dark:border-t-white" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {t("processing") || "Transcribing..."}
                      </span>
                    </div>
                  </motion.div>
                ) : (
                  <div className="relative transition-all duration-300 hover:transform hover:scale-[1.01] p-4">
                    <Textarea
                      ref={textareaRef}
                      placeholder={t("typeYourResponse")}
                      value={textInput}
                      onChange={handleTextInputChange}
                      onKeyDown={handleKeyDown}
                      className="resize-none w-full p-4 rounded-xl border bg-white/80 dark:bg-gray-800/80 dark:border-gray-700 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 transition-all duration-300 mb-2"
                      rows={3}
                      disabled={
                        isGenerating ||
                        isInterviewing ||
                        (isLocked && !isFreemiumEnabled)
                      }
                    />
                    <div className="flex justify-between items-center space-x-3 px-1">
                      <div className="flex items-center space-x-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          className="h-9 w-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300"
                          onClick={() => setIsTtsEnabled(!isTtsEnabled)}
                        >
                          {isTtsEnabled ? (
                            <Volume2 className="h-4 w-4 text-gray-500" />
                          ) : (
                            <VolumeX className="h-4 w-4 text-gray-500" />
                          )}
                        </Button>
                        {isTtsEnabled && (
                          <>
                            <Select
                              value={selectedVoice}
                              onValueChange={setSelectedVoice}
                            >
                              <SelectTrigger className="w-[140px] h-9 rounded-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {VOICE_OPTIONS.map((voice) => (
                                  <SelectItem
                                    key={voice.voiceId}
                                    value={voice.voiceId}
                                  >
                                    {voice.title}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select
                              value={String(playbackSpeed)}
                              onValueChange={(value) =>
                                setPlaybackSpeed(parseFloat(value))
                              }
                            >
                              <SelectTrigger className="w-[80px] h-9 rounded-full">
                                <SelectValue
                                  placeholder={`${playbackSpeed}x`}
                                />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="0.5">0.5x</SelectItem>
                                <SelectItem value="1">1.0x</SelectItem>
                                <SelectItem value="1.5">1.5x</SelectItem>
                                <SelectItem value="2">2.0x</SelectItem>
                              </SelectContent>
                            </Select>
                          </>
                        )}
                      </div>
                      <div className="flex space-x-3">
                        <Button
                          variant="secondary"
                          type="button"
                          className="h-9 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 flex items-center justify-center gap-2"
                          onClick={handleRecordingToggle}
                          disabled={
                            isGenerating ||
                            isInterviewing ||
                            (isLocked && !isFreemiumEnabled) ||
                            (!user && !captchaToken)
                          }
                        >
                          <Mic className="h-4 w-4" />
                          {t("voice")}
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          className="h-9 w-9 rounded-full bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 transition-all duration-300 flex items-center justify-center"
                          onClick={handleSendButtonClick}
                          disabled={
                            (!textInput.trim() && !isRecording) ||
                            isGenerating ||
                            isInterviewing ||
                            (isLocked && !isFreemiumEnabled) ||
                            (!user && !captchaToken)
                          }
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </Card>
          {!user && (
            <div className="flex justify-center mt-4">
              <Turnstile
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                onSuccess={(token) => {
                  setCaptchaToken(token);
                }}
              />
            </div>
          )}
        </div>

        {/* Resume preview column - shown when resume exists or generating */}
        {shouldShowSplitView && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col h-full overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {isGenerating && !resume ? (
                <div className="h-full flex items-center justify-center">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center space-y-4"
                  >
                    <div className="h-12 w-12 mx-auto animate-spin rounded-full border-4 border-gray-300 border-t-gray-900 dark:border-gray-600 dark:border-t-gray-300" />
                    <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                      {t("generation.title")}
                    </p>
                  </motion.div>
                </div>
              ) : resume && resumeId && user ? (
                user.is_anonymous ? (
                  <LockedResumeOverlay resumeId={resumeId} />
                ) : (
                  <ResumePreview
                    resume={resume}
                    loading={isGenerating}
                    setResume={setResume}
                    resumeId={resumeId}
                    hasReachedFreemiumLimit={hasReachedFreemiumLimit}
                    editCount={editCount}
                    onShowLimitDialog={() => setShowLimitDialog(true)}
                    isFreemiumEnabled={isFreemiumEnabled}
                    isLocked={isLocked}
                  />
                )
              ) : null}
            </div>
          </motion.div>
        )}
      </div>

      {/* Add the limit reached dialog */}
      <Dialog open={showLimitDialog} onOpenChange={setShowLimitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("freemium.limitReached.title")}</DialogTitle>
            <DialogDescription>
              {isSubscriptionVariant
                ? t("freemium.limitReached.description")
                : credits < 1
                  ? t("freemium.limitReached.descriptionNoCredits", {
                      numberOfCredits: 1,
                    })
                  : t("freemium.limitReached.descriptionWithCredits", {
                      numberOfCredits: 1,
                    })}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowLimitDialog(false)}>
              {t("freemium.limitReached.cancel")}
            </Button>
            {isSubscriptionVariant ? (
              <Link href="/purchase">
                <Button>{t("freemium.limitReached.upgrade")}</Button>
              </Link>
            ) : credits < 1 ? (
              <Link href="/purchase">
                <Button>{t("freemium.limitReached.purchaseCredits")}</Button>
              </Link>
            ) : (
              <form action={unlockAction}>
                <input type="hidden" name="resumeId" value={resumeId} />
                <Button type="submit" disabled={unlockPending}>
                  {unlockPending
                    ? t("freemium.limitReached.unlocking")
                    : t("freemium.limitReached.unlockWithCredit")}
                </Button>
              </form>
            )}
          </div>
          {unlockState?.error && (
            <FormMessage message={{ error: unlockState.error }} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
