"use client";

import {
  useState,
  useEffect,
  useRef,
  useActionState,
  useCallback,
} from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import ResumePreview from "./ResumePreview";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Mic, Send, Lock } from "lucide-react";
import { useVoiceRecording } from "./useVoiceRecording";
import VoiceRecordingOverlay from "./VoiceRecordingOverlay";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { Tables } from "@/utils/supabase/database.types";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import remarkGfm from "remark-gfm";
import ReactMarkdown from "react-markdown";
import { FormMessage, Message } from "@/components/form-message";
import { Link } from "@/i18n/routing";
import { saveResume, unlockResume } from "../actions";
import { User } from "@supabase/supabase-js";
import { Turnstile } from "@marsidev/react-turnstile";
import { linkAnonymousAccount } from "@/components/auth/actions";
import { SubmitButton } from "@/components/submit-button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CoreAssistantMessage, CoreMessage, CoreUserMessage } from "ai";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export type ResumeDataType = Tables<"resumes"> & {
  resume_sections: (Tables<"resume_sections"> & {
    resume_list_items: Tables<"resume_list_items">[];
    resume_detail_items: (Tables<"resume_detail_items"> & {
      resume_item_descriptions: Tables<"resume_item_descriptions">[];
    })[];
  })[];
};

const LockedResumeOverlay = ({
  hasCredits,
  requiredCredits,
  resumeId,
  onUnlock,
  resume,
  resumeBuilderRequiresEmail,
  user,
}: {
  hasCredits: boolean;
  requiredCredits: number;
  resumeId: string;
  onUnlock: (resumeId: string) => void;
  resume: ResumeDataType;
  resumeBuilderRequiresEmail: boolean;
  user: User;
}) => {
  const t = useTranslations("resumeBuilder");
  const [unlockState, unlockAction, unlockPending] = useActionState(
    unlockResume,
    { error: "" }
  );
  const [
    linkAnonymousAccountState,
    linkAnonymousAccountAction,
    linkAnonymousAccountPending,
  ] = useActionState(linkAnonymousAccount, { error: "" });

  useEffect(() => {
    if (unlockState?.success) {
      onUnlock(resumeId);
    }
  }, [unlockState?.success]);

  const firstSection = resume.resume_sections[0];
  const showEmailForm = resumeBuilderRequiresEmail && !user.email;
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
      {/* Preview Section */}
      <div className="absolute inset-0">
        <div className="p-6">
          {/* Contact Information */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {resume.name}
            </h1>
            <div className="flex flex-wrap gap-2 text-sm mt-1 text-gray-600 dark:text-gray-300">
              {resume.email && <span>{resume.email}</span>}
              {resume.phone && <span>• {resume.phone}</span>}
              {resume.location && <span>• {resume.location}</span>}
            </div>
          </div>

          {/* First Section Preview */}
          {firstSection && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold border-b pb-1 mb-2 text-gray-900 dark:text-white">
                {firstSection.title}
              </h2>
              {firstSection.resume_list_items.length > 0 ? (
                <div className="flex flex-col flex-wrap gap-0.5">
                  {firstSection.resume_list_items
                    .slice(0, 3)
                    .map((skill, index) => (
                      <span
                        key={index}
                        className="text-sm px-2 text-gray-600 dark:text-gray-300"
                      >
                        {skill.content}
                      </span>
                    ))}
                  {firstSection.resume_list_items.length > 3 && (
                    <span className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      ...
                    </span>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {firstSection.resume_detail_items
                    .slice(0, 1)
                    .map((item, index) => (
                      <div key={index} className="text-sm">
                        {item.title && (
                          <div className="font-medium text-gray-800 dark:text-gray-200">
                            {item.title}
                          </div>
                        )}
                        {item.subtitle && (
                          <div className="flex justify-between text-gray-600 dark:text-gray-300">
                            <div>{item.subtitle}</div>
                            {item.date_range && <div>{item.date_range}</div>}
                          </div>
                        )}
                        {item.resume_item_descriptions &&
                          item.resume_item_descriptions.length > 0 && (
                            <div className="mt-1">
                              <ul className="space-y-1">
                                {item.resume_item_descriptions
                                  .slice(0, 2)
                                  .map((point, pointIndex) => (
                                    <li
                                      key={pointIndex}
                                      className="flex items-center text-gray-600 dark:text-gray-300 before:content-['•'] before:mr-2 pl-0 list-none"
                                    >
                                      {point.description}
                                    </li>
                                  ))}
                                {item.resume_item_descriptions.length > 2 && (
                                  <li className="text-sm text-gray-500 dark:text-gray-400">
                                    ...
                                  </li>
                                )}
                              </ul>
                            </div>
                          )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Gradient Overlay - Adjusted to start fading earlier */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-transparent via-white/70 to-white/95 dark:via-gray-800/70 dark:to-gray-800/95 pointer-events-none"
          style={{
            background: `linear-gradient(to bottom, 
                 transparent 0%, 
                 rgba(255, 255, 255, 0.7) 40%, 
                 rgba(255, 255, 255, 0.95) 70%
               )`,
            backgroundColor: "transparent",
          }}
        />

        {/* Blur Overlay - Adjusted to align with gradient */}
        <div
          className="absolute inset-0 bg-white/30 dark:bg-gray-800/30 backdrop-blur-[2px] pointer-events-none"
          style={{
            maskImage: "linear-gradient(to bottom, transparent 30%, black 70%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 30%, black 70%)",
          }}
        />
      </div>

      {/* Lock UI */}
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
              {showEmailForm
                ? t("locked.descriptionEmailForm")
                : hasCredits
                  ? t("locked.descriptionWithCredits", {
                      credits: requiredCredits,
                    })
                  : t("locked.descriptionNoCredits", {
                      credits: requiredCredits,
                    })}
            </p>
          </div>
          {showEmailForm ? (
            <div className="md mx-auto w-full text-left">
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-2">
                  {t("form.title")}
                </h2>
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
          ) : (
            <>
              {hasCredits ? (
                <form action={unlockAction}>
                  <input type="hidden" name="resumeId" value={resumeId} />
                  <Button type="submit" disabled={unlockPending}>
                    {unlockPending
                      ? t("locked.unlocking")
                      : t("locked.unlockButton", { credits: requiredCredits })}
                  </Button>
                </form>
              ) : (
                <Link href="/purchase">
                  <Button>{t("locked.purchaseButton")}</Button>
                </Link>
              )}
              {unlockState?.error && (
                <FormMessage message={{ error: unlockState.error }} />
              )}
            </>
          )}
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
  resumeBuilderRequiresEmail = true,
}: {
  resumeId?: string;
  hasSubscription: boolean;
  credits: number;
  user: User | null;
  resumeBuilderRequiresEmail?: boolean;
}) {
  const t = useTranslations("resumeBuilder");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [textInput, setTextInput] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [messages, setMessages] = useState<CoreMessage[]>([]);
  const [resume, setResume] = useState<ResumeDataType | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { logError } = useAxiomLogging();
  const router = useRouter();

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

  const handleRecordingToggle = async () => {
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

  const sendInterviewMessage = async (transcription?: string) => {
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

      // Remove the temporary "..." message
      setMessages((prev) => prev.slice(0, -1));

      // Add the AI response as a new message
      const aiMessage: CoreAssistantMessage = {
        role: "assistant",
        content: interviewerResponse,
      };

      setMessages((prev) => [...prev, aiMessage]);

      // If interview is complete, set resume as ready and generate it
      if (interviewIsComplete) {
        generateResume([...updatedMessages]);
      }
    } catch (error) {
      logError("Error in AI resume conversation:", { error });
      // Update the last message to show the error
      setMessages((prev) => {
        const updatedMessages = [...prev];
        updatedMessages[updatedMessages.length - 1] = {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        };
        return updatedMessages;
      });
    }
  };

  const handleSendButtonClick = () => {
    sendMessage();
  };

  const sendMessage = async () => {
    if (resumeId) {
      sendEditMessage();
    } else {
      sendInterviewMessage();
    }
  };

  const sendEditMessage = async () => {
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

    const response = await fetch("/api/resume/edit", {
      method: "POST",
      body: JSON.stringify({
        resume: resume,
        userMessage: messageContent,
      }),
    });

    setMessages((prev) => prev.slice(0, -1));

    // Add the AI response as a new message

    if (!response.ok) {
      const aiMessage: CoreAssistantMessage = {
        role: "assistant",
        content: t("errors.resumeEditError"),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } else {
      const data = await response.json();
      const { updatedResume, aiResponse } = data;
      const aiMessage: CoreAssistantMessage = {
        role: "assistant",
        content: aiResponse,
      };

      setMessages((prev) => [...prev, aiMessage]);
      setResume(updatedResume);
      void saveResume(updatedResume, resumeId);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const generateResume = async (conversationHistory: CoreMessage[]) => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/resume/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: conversationHistory,
          captchaToken,
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
        alert(error);
      }
      if (!resumeId) {
        throw new Error("No resume ID returned from server");
      }
      router.replace(`/dashboard/resumes/${resumeId}`);
    } catch (error) {
      logError("Error generating resume:", { error });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: t("errors.resumeGenerationError"),
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  // Update the shouldShowSplitView logic to include isGenerating
  const shouldShowSplitView = resumeId || isGenerating;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div
        className={`flex-1 grid ${
          shouldShowSplitView ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
        } gap-8 p-8 overflow-hidden max-w-[2000px] mx-auto w-full h-full`}
      >
        {/* Chat UI column - always shown */}
        <div
          className={`m-1 flex flex-col h-full overflow-hidden ${
            shouldShowSplitView ? "" : "lg:col-span-2 max-w-3xl mx-auto w-full"
          }`}
        >
          {/* Title Section */}
          <div className="flex-none mb-4 space-y-1">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {t("title")}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("description")}
            </p>
          </div>

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
                      placeholder={t("typeYourResponse")}
                      value={textInput}
                      onChange={handleTextInputChange}
                      onKeyDown={handleKeyDown}
                      className="resize-none w-full p-4 rounded-xl border bg-white/80 dark:bg-gray-800/80 dark:border-gray-700 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 transition-all duration-300 mb-2"
                      rows={3}
                      disabled={isGenerating}
                    />
                    <div className="flex justify-end space-x-3 px-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        className="h-9 w-9 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 flex items-center justify-center"
                        onClick={handleRecordingToggle}
                        disabled={isGenerating}
                      >
                        <Mic className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        className="h-9 w-9 rounded-full bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 transition-all duration-300 flex items-center justify-center"
                        onClick={handleSendButtonClick}
                        disabled={
                          (!textInput.trim() && !isRecording) ||
                          isGenerating ||
                          (!user && !captchaToken)
                        }
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </div>
            {!user && (
              <div className="mt-4">
                <Turnstile
                  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                  onSuccess={(token) => {
                    setCaptchaToken(token);
                  }}
                />
              </div>
            )}
          </Card>
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
                resume.locked_status === "locked" && !hasSubscription ? (
                  <LockedResumeOverlay
                    hasCredits={credits >= 1}
                    requiredCredits={1}
                    resumeId={resumeId}
                    onUnlock={() => {
                      fetchResumeData(resumeId);
                    }}
                    resume={resume}
                    resumeBuilderRequiresEmail={resumeBuilderRequiresEmail}
                    user={user}
                  />
                ) : (
                  <ResumePreview
                    resume={resume}
                    loading={isGenerating}
                    setResume={setResume}
                    resumeId={resumeId}
                  />
                )
              ) : null}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
