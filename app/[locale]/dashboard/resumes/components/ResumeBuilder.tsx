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
import { Card, CardContent } from "@/components/ui/card";
import { Lock, PlayCircle } from "lucide-react";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { Tables } from "@/utils/supabase/database.types";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";
import { motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
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
import * as Sentry from "@sentry/nextjs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Turnstile } from "@marsidev/react-turnstile";
import { ChatUI } from "@/app/components/chat";
import { TtsProvider, useTts } from "@/app/context/TtsContext";
import { VOICE_OPTIONS } from "@/app/types/tts";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useResumeEditAgent } from "../agent/useResumeEdit";
import { H2 } from "@/components/typography";
import { FileSelectionModal } from "./FileSelectionModal";

export type ResumeDataType = Tables<"resumes"> & {
  resume_sections: (Tables<"resume_sections"> & {
    resume_list_items: Tables<"resume_list_items">[];
    resume_detail_items: (Tables<"resume_detail_items"> & {
      resume_item_descriptions: Tables<"resume_item_descriptions">[];
    })[];
  })[];
};

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

interface StartScreenProps {
  onStart: () => void;
  initialVoice?: string;
  onVoiceChange: (voiceId: string) => void;
  initialTtsEnabled: boolean;
  onTtsEnabledChange: (enabled: boolean) => void;
  selectedVoiceId: string;
  onSelectedVoiceIdChange: (voiceId: string) => void;
  existingResume: Tables<"user_files">[];
  setExistingResume: (resume: Tables<"user_files">[]) => void;
  additionalFiles: Tables<"user_files">[];
  setAdditionalFiles: (files: Tables<"user_files">[]) => void;
  user: User | null;
  setCaptchaToken: (token: string) => void;
  captchaToken: string;
  enableResumesFileUpload: boolean;
}

const StartScreen = ({
  enableResumesFileUpload,
  onStart,
  initialVoice,
  onVoiceChange,
  initialTtsEnabled,
  onTtsEnabledChange,
  selectedVoiceId,
  onSelectedVoiceIdChange,
  existingResume,
  setExistingResume,
  additionalFiles,
  setAdditionalFiles,
  user,
  setCaptchaToken,
  captchaToken,
}: StartScreenProps) => {
  const t = useTranslations("resumeBuilder");
  const [ttsEnabled, setTtsEnabled] = useState(initialTtsEnabled);

  const handleStart = () => {
    onTtsEnabledChange(ttsEnabled);
    onVoiceChange(selectedVoiceId);
    onStart();
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-4 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-lg">
        <CardContent className="pt-6 space-y-8">
          <div className="text-center space-y-2">
            {initialVoice ? (
              <>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {
                    VOICE_OPTIONS.find(
                      (voice) => voice.voiceId === initialVoice
                    )?.title
                  }{" "}
                  To Resume
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                  {t("descriptionV2")}
                </p>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {t("titleV2")}
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                  {t("descriptionV2")}
                </p>
              </>
            )}
          </div>

          <div className="space-y-6">
            {enableResumesFileUpload && (
              <div className="space-y-2">
                <FileSelectionModal
                  onFileSelect={(files: Tables<"user_files">[]) => {
                    // Filter out any files that are already selected as the resume
                    const newFiles = files.filter(
                      (file) => !existingResume.some((r) => r.id === file.id)
                    );
                    setAdditionalFiles(newFiles);
                  }}
                  selectedFiles={additionalFiles}
                  disabledFiles={existingResume}
                />
                {additionalFiles.length > 0 && (
                  <div className="text-sm text-muted-foreground pl-2">
                    <p className="font-medium">
                      {t("startScreen.selectedContextFiles")} (
                      {additionalFiles.length}):
                    </p>
                    <ul className="list-disc list-inside">
                      {additionalFiles.map((file) => (
                        <li key={file.id} className="truncate">
                          {file.display_name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between">
              <Label htmlFor="tts-toggle">{t("startScreen.enableVoice")}</Label>
              <Switch
                id="tts-toggle"
                checked={ttsEnabled}
                onCheckedChange={(checked) => setTtsEnabled(checked)}
              />
            </div>

            {ttsEnabled && (
              <div className="space-y-2">
                <Label htmlFor="voice-select">
                  {t("startScreen.selectVoice")}
                </Label>
                <Select
                  value={selectedVoiceId}
                  onValueChange={onSelectedVoiceIdChange}
                >
                  <SelectTrigger id="voice-select">
                    <SelectValue placeholder="Select a voice" />
                  </SelectTrigger>
                  <SelectContent>
                    {VOICE_OPTIONS.map((voice) => (
                      <SelectItem key={voice.voiceId} value={voice.voiceId}>
                        {voice.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button
              onClick={handleStart}
              className="w-full"
              disabled={!user && !captchaToken}
            >
              {t("startScreen.startButton")}
            </Button>
          </div>
        </CardContent>
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
  );
};

const ResumeBuilderComponent = ({
  resumeId,
  hasSubscription,
  credits,
  user,
  isSubscriptionVariant,
  isFreemiumEnabled,
  persona,
  transformResumeEnabled,
  transformSummary,
  enableResumesFileUpload,
}: {
  resumeId?: string;
  hasSubscription: boolean;
  credits: number;
  user: User | null;
  isSubscriptionVariant: boolean;
  isFreemiumEnabled: boolean;
  persona?: string;
  transformResumeEnabled: boolean;
  transformSummary?: string;
  enableResumesFileUpload: boolean;
}) => {
  const t = useTranslations("resumeBuilder");
  const [isDemoDismissed, setIsDemoDismissed] = useState<boolean>(false);
  const [isMobileView, setIsMobileView] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isInterviewing, setIsInterviewing] = useState<boolean>(false);
  const [messages, setMessages] = useState<CoreMessage[]>([]);
  const [resume, setResume] = useState<ResumeDataType | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(
    persona || "alloy"
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { logError } = useAxiomLogging();
  const router = useRouter();
  const [editCount, setEditCount] = useState<number>(0);
  const [showLimitDialog, setShowLimitDialog] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const MAX_FREE_EDITS = 0;
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
  const showDemoCTA = pathname?.includes("/dashboard/resumes");
  const { selectedVoice, setSelectedVoice, setIsTtsEnabled } = useTts();
  const { sendResumeEdit } = useResumeEditAgent({
    setMessages,
    currentResume: resume as ResumeDataType,
    setResume: (resume: ResumeDataType) => {
      setResume(resume);
      if (resumeId) {
        saveResume(resume, resumeId);
      }
    },
  });
  const [additionalFiles, setAdditionalFiles] = useState<
    Tables<"user_files">[]
  >([]);
  const [existingResume, setExistingResume] = useState<Tables<"user_files">[]>(
    []
  );

  const handleVoiceChange = useCallback(
    (voiceId: string) => {
      const voice = VOICE_OPTIONS.find((v) => v.voiceId === voiceId);
      if (voice) {
        setSelectedVoice(voice);
      }
    },
    [setSelectedVoice]
  );

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

  const shouldShowSplitView = resumeId || isGenerating;
  const isLocked = Boolean(
    resume && resume?.locked_status === "locked" && !hasSubscription
  );
  const hasReachedFreemiumLimit = editCount >= MAX_FREE_EDITS;

  useEffect(() => {
    const selectedVoice = VOICE_OPTIONS.find(
      (voice) => voice.voiceId === selectedVoiceId
    );

    // Use the transformation summary if available, otherwise use the default messages
    let initialMessage = "";

    if (transformSummary) {
      initialMessage = transformSummary;
    } else if (existingResume.length > 0) {
      initialMessage = t("existingResumeInitialMessage", {
        fileName: existingResume[0].display_name,
      });
    } else if (resumeId) {
      initialMessage = t("editResumeInitialMessage");
    } else {
      initialMessage = t("createResumeInitialMessage");
    }

    // If we have a selected voice with a speaking style, modify the message accordingly
    if (
      selectedVoice?.speakingStyle &&
      !transformSummary &&
      !existingResume.length
    ) {
      if (selectedVoice.voiceId === "dg") {
        initialMessage = `Listen up, buttercup! You want a killer resume? I need the intel.

  Name. Email. Work and education history – the REAL stuff, the grit. And your damn skills – what makes you a weapon?

  Spit it out. I ain't got all day to coddle you. Give me the raw data, and we'll forge something that'll make them take notice. Then, we'll keep grinding until it's perfect.

  No excuses. Let's GO.

  Stay hard!
        `;
      } else if (selectedVoice.voiceId === "lbj") {
        initialMessage = `Yo, what up, fam? You tryna get that next-level resume, huh? Aight, I feel you. But look, ain't nothin' in this world just gon' fall in your lap. You gotta put in that work, you gotta grind for it.

So, lemme get the details. Name, email, your work and school history – the real journey. And them skills you bringin'.

Give it to me straight up. We gon' cook somethin' solid, then keep workin' till it's straight fire.

Stay focused, stay hungry. Let's get it.
        `;
      } else if (selectedVoice.voiceId === "cw") {
        initialMessage = `You wanna make a super cool professional resume? That sounds like fun!  But first, unnie needs to know a little bit about you, okay? 

Could you tell me your name? And maybe your email address so we can stay in touch? Oh! And what about your work history and where you went to school? And also, what are some of the amazing skills you have? You must have so many! 

Once I have all that information, I can try my best to make a really great first draft of your resume for you! Then, we can keep working on it together to make it absolutely perfect! 
        `;
      }
    }

    setMessages([
      {
        role: "assistant",
        content: initialMessage,
      },
    ]);
  }, [
    resumeId,
    persona,
    t,
    hasStarted,
    selectedVoiceId,
    transformSummary,
    existingResume,
  ]);

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
        logError("Error fetching resume data:", { error });
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

  const handleSendMessage = async (message: string) => {
    if (isLocked && isFreemiumEnabled && hasReachedFreemiumLimit) {
      setShowLimitDialog(true);
      return;
    }

    let messagesResponse: { message: string; index: number };
    if (resumeId) {
      setIsGenerating(true);
      await sendResumeEdit([...messages, { role: "user", content: message }]);
      if (isFreemiumEnabled && !hasSubscription) {
        await trackResumeEdit(resumeId);
        setEditCount((prev) => prev + 1);
      }
      setIsGenerating(false);
      // Return the last message for TTS
      return {
        message: messages[messages.length - 1].content as string,
        index: messages.length - 1,
      };
    } else {
      setIsInterviewing(true);
      messagesResponse = await sendInterviewMessage(message);
      setIsInterviewing(false);
    }

    if (!user && captchaToken) {
      const formData = new FormData();
      formData.set("captchaToken", captchaToken);
      formData.set("currentPath", pathname || "");
      startTransition(() => {
        verifyAnonymousUserAction(formData);
      });
    }
    return messagesResponse;
  };

  const sendInterviewMessage = async (
    messageContent: string,
    retryCount = 0
  ) => {
    let updatedMessages: CoreMessage[] = [
      ...messages,
      {
        role: "user",
        content: messageContent,
      },
    ];

    setMessages(updatedMessages);

    updatedMessages = [
      ...updatedMessages,
      {
        role: "assistant",
        content: "",
      },
    ];

    setMessages(updatedMessages);

    try {
      // Send to backend for processing
      const response = await fetch("/api/resume/interview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: updatedMessages,
          speakingStyle: selectedVoice.speakingStyle,
          existingResumeFileIds: existingResume.map((file) => file.id),
          additionalFileIds: additionalFiles.map((file) => file.id),
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      // Parse the JSON response
      const data = await response.json();
      const { interviewIsComplete, interviewerResponse } = data;
      const aiMessage: CoreAssistantMessage = {
        role: "assistant",
        content: interviewerResponse,
      };
      updatedMessages = [...updatedMessages.slice(0, -1), aiMessage];
      setMessages(updatedMessages);

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

      const aiMessage: CoreAssistantMessage = {
        role: "assistant",
        content: t("errors.resumeGenerationError"),
      };
      updatedMessages = [...updatedMessages, aiMessage];
      setMessages(updatedMessages);
      Sentry.captureException(error);
    } finally {
      return {
        message: updatedMessages[updatedMessages.length - 1].content as string,
        index: updatedMessages.length - 1,
      };
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
          existingResumeFileIds: existingResume.map((file) => file.id),
          additionalFileIds: additionalFiles.map((file) => file.id),
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

  if (!hasStarted && !resumeId) {
    return (
      <StartScreen
        enableResumesFileUpload={enableResumesFileUpload}
        onStart={() => setHasStarted(true)}
        initialVoice={persona}
        onVoiceChange={handleVoiceChange}
        initialTtsEnabled={Boolean(persona)}
        onTtsEnabledChange={setIsTtsEnabled}
        selectedVoiceId={selectedVoiceId}
        onSelectedVoiceIdChange={setSelectedVoiceId}
        existingResume={existingResume}
        setExistingResume={setExistingResume}
        additionalFiles={additionalFiles}
        setAdditionalFiles={setAdditionalFiles}
        user={user}
        setCaptchaToken={setCaptchaToken}
        captchaToken={captchaToken}
      />
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {!resume && messages.length === 1 && !isDemoDismissed && showDemoCTA && (
        <Card className="mx-4 md:mx-12 my-4 md:my-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50">
          <CardContent className="px-4 md:px-6 py-6 md:py-8 relative">
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
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
              <div className="space-y-4">
                <h2 className="text-xl md:text-2xl font-bold text-foreground">
                  {t("demoTitle")}
                </h2>
                <p className="text-muted-foreground max-w-lg">
                  {t("demoDescription")}
                </p>
              </div>
              <Link href="/resume-builder-demo" className="w-full md:w-auto">
                <Button size="lg" className="gap-2 w-full md:w-auto">
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
          shouldShowSplitView
            ? "grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8"
            : "grid-cols-1"
        } p-4 md:p-8 overflow-hidden max-w-[2000px] mx-auto w-full h-full`}
      >
        {/* Chat UI column - always shown */}
        <div
          className={`flex flex-col h-full overflow-hidden ${
            shouldShowSplitView
              ? "order-1 lg:order-1"
              : "lg:col-span-2 max-w-3xl mx-auto w-full"
          } ${user?.is_anonymous && resumeId ? "hidden" : ""}`}
        >
          {/* Title Section */}
          {shouldShowSplitView ? (
            isEditMode ? (
              <Input
                value={resume?.title || ""}
                onChange={(e) => {
                  if (resume) {
                    setResume({
                      ...resume,
                      title: e.target.value,
                    });
                  }
                }}
                className="text-xl font-semibold mb-4"
                placeholder={t("form.placeholders.title")}
              />
            ) : (
              <H2>{resume?.title}</H2>
            )
          ) : (
            <div className="flex-none mb-4 space-y-1 px-4">
              <h1 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white text-center">
                {t("titleV2")}
              </h1>
              <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 text-center">
                {t("descriptionV2")}
              </p>
            </div>
          )}

          <Card className="flex-1 bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg md:rounded-2xl shadow-lg flex flex-col border-0 transition-all duration-300 overflow-hidden min-h-0">
            <ChatUI
              messages={messages}
              onSendMessage={handleSendMessage}
              isProcessing={isGenerating || isInterviewing}
              isDisabled={
                (isLocked && !isFreemiumEnabled) || (!user && !captchaToken)
              }
              showTtsControls={true}
            />
          </Card>
        </div>

        {/* Resume preview column - shown when resume exists or generating */}
        {shouldShowSplitView && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col h-full overflow-hidden order-2 lg:order-2"
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
                    <p className="text-base md:text-lg font-medium text-gray-900 dark:text-gray-100">
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
                    isEditMode={isEditMode}
                    setIsEditMode={setIsEditMode}
                    transformResumeEnabled={transformResumeEnabled}
                  />
                )
              ) : null}
            </div>
          </motion.div>
        )}
      </div>

      {/* Add the limit reached dialog */}
      <Dialog open={showLimitDialog} onOpenChange={setShowLimitDialog}>
        <DialogContent className="sm:max-w-md">
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
          <div className="mt-6 flex flex-col sm:flex-row justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowLimitDialog(false)}
              className="w-full sm:w-auto"
            >
              {t("freemium.limitReached.cancel")}
            </Button>
            {isSubscriptionVariant ? (
              <Link href="/purchase" className="w-full sm:w-auto">
                <Button className="w-full">
                  {t("freemium.limitReached.upgrade")}
                </Button>
              </Link>
            ) : credits < 1 ? (
              <Link href="/purchase" className="w-full sm:w-auto">
                <Button className="w-full">
                  {t("freemium.limitReached.purchaseCredits")}
                </Button>
              </Link>
            ) : (
              <form action={unlockAction} className="w-full sm:w-auto">
                <input type="hidden" name="resumeId" value={resumeId} />
                <Button
                  type="submit"
                  disabled={unlockPending}
                  className="w-full"
                >
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
};

export default function ResumeBuilder({
  resumeId,
  hasSubscription,
  credits,
  user,
  isSubscriptionVariant,
  isFreemiumEnabled,
  persona,
  transformResumeEnabled,
  transformSummary,
  enableResumesFileUpload,
}: {
  resumeId?: string;
  hasSubscription: boolean;
  credits: number;
  user: User | null;
  isSubscriptionVariant: boolean;
  isFreemiumEnabled: boolean;
  enableResumesFileUpload: boolean;
  persona?: string;
  transformResumeEnabled: boolean;
  transformSummary?: string;
}) {
  return (
    <TtsProvider
      initialVoice={VOICE_OPTIONS.find((voice) => voice.voiceId === persona)}
      initialTtsEnabled={Boolean(persona)}
    >
      <ResumeBuilderComponent
        resumeId={resumeId}
        hasSubscription={hasSubscription}
        credits={credits}
        user={user}
        isSubscriptionVariant={isSubscriptionVariant}
        isFreemiumEnabled={isFreemiumEnabled}
        persona={persona}
        transformResumeEnabled={transformResumeEnabled}
        transformSummary={transformSummary}
        enableResumesFileUpload={enableResumesFileUpload}
      />
    </TtsProvider>
  );
}
