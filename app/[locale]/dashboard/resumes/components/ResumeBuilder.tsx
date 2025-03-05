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
import { Content } from "@google/generative-ai";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { Tables } from "@/utils/supabase/database.types";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import remarkGfm from "remark-gfm";
import ReactMarkdown from "react-markdown";
import { unlockResume } from "./actions";
import { FormMessage } from "@/components/form-message";
import { Link } from "@/i18n/routing";
// Define types to structure the aggregated resume data using Tables types
type ResumeSection = {
  title: Tables<"resume_sections">["title"];
  content:
    | Tables<"resume_list_items">["content"][]
    | {
        title: Tables<"resume_detail_items">["title"];
        organization: Tables<"resume_detail_items">["subtitle"];
        date: Tables<"resume_detail_items">["date_range"];
        description: Tables<"resume_item_descriptions">["description"][];
      }[];
};

export type ResumeDataType = {
  name: Tables<"resumes">["name"];
  email: NonNullable<Tables<"resumes">["email"]>;
  phone: NonNullable<Tables<"resumes">["phone"]>;
  location: NonNullable<Tables<"resumes">["location"]>;
  summary: NonNullable<Tables<"resumes">["summary"]>;
  sections: ResumeSection[];
  locked_status: Tables<"resumes">["locked_status"];
};

const LockedResumeOverlay = ({
  hasCredits,
  requiredCredits,
  resumeId,
  onUnlock,
}: {
  hasCredits: boolean;
  requiredCredits: number;
  resumeId: string;
  onUnlock: (resumeId: string) => void;
}) => {
  const t = useTranslations("resumeBuilder");
  const router = useRouter();
  const [state, action, pending] = useActionState(unlockResume, { error: "" });

  useEffect(() => {
    if (state?.success) {
      onUnlock(resumeId);
    }
  }, [state?.success]);

  return (
    <div className="flex-grow overflow-auto bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-md shadow-sm border p-6 flex flex-col items-center justify-center space-y-6 text-center h-full">
      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
        <Lock className="w-8 h-8 text-gray-500 dark:text-gray-400" />
      </div>
      <div className="space-y-2 max-w-md">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          {t("locked.title")}
        </h3>
        <p className="text-gray-600 dark:text-gray-300">
          {hasCredits
            ? t("locked.descriptionWithCredits", { credits: requiredCredits })
            : t("locked.descriptionNoCredits", { credits: requiredCredits })}
        </p>
      </div>
      {hasCredits ? (
        <form action={action}>
          <input type="hidden" name="resumeId" value={resumeId} />
          <Button type="submit" disabled={pending}>
            {pending
              ? t("locked.unlocking")
              : t("locked.unlockButton", { credits: requiredCredits })}
          </Button>
        </form>
      ) : (
        <Link href="/purchase">
          <Button>{t("locked.purchaseButton")}</Button>
        </Link>
      )}
      {state?.error && <FormMessage message={{ error: state.error }} />}
    </div>
  );
};

export default function ResumeBuilder({
  resumeId,
  hasSubscription,
  isAnonymous,
  credits,
}: {
  resumeId?: string;
  hasSubscription: boolean;
  isAnonymous: boolean;
  credits: number;
}) {
  const t = useTranslations("resumeBuilder");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [textInput, setTextInput] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [messages, setMessages] = useState<Content[]>([]);
  const [resume, setResume] = useState<ResumeDataType | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { logError } = useAxiomLogging();
  const router = useRouter();

  // Initialize the conversation with the first AI message
  useEffect(() => {
    if (resumeId) {
      setMessages([
        {
          role: "model",
          parts: [
            {
              text: t("editResumeInitialMessage"),
            },
          ],
        },
      ]);
    } else {
      setMessages([
        {
          role: "model",
          parts: [
            {
              text: t("createResumeInitialMessage"),
            },
          ],
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
        const { data: resumeData, error: resumeError } = await supabase
          .from("resumes")
          .select("*")
          .eq("id", resumeId)
          .single();

        if (resumeError || !resumeData) {
          throw new Error(resumeError?.message || "Resume not found");
        }

        // Fetch resume sections
        const { data: sectionsData, error: sectionsError } = await supabase
          .from("resume_sections")
          .select("*")
          .eq("resume_id", resumeId)
          .order("display_order", { ascending: true });

        if (sectionsError) {
          throw new Error(sectionsError.message);
        }

        // Create an array to hold all section data with their content
        const formattedSections = [];

        // Process each section
        for (const section of sectionsData as Tables<"resume_sections">[]) {
          // Check if it's a skills section (usually just list items)
          const isSkillsSection = section.title.toLowerCase().includes("skill");

          if (isSkillsSection) {
            // Fetch skills list items
            const { data: listItems, error: listError } = await supabase
              .from("resume_list_items")
              .select("*")
              .eq("section_id", section.id)
              .order("display_order", { ascending: true });

            if (listError) {
              throw new Error(listError.message);
            }

            // Add skills section with list items as content
            formattedSections.push({
              title: section.title,
              content: (listItems as Tables<"resume_list_items">[]).map(
                (item) => item.content
              ),
            });
          } else {
            // Fetch detail items for this section
            const { data: detailItems, error: detailError } = await supabase
              .from("resume_detail_items")
              .select("*")
              .eq("section_id", section.id)
              .order("display_order", { ascending: true });

            if (detailError) {
              throw new Error(detailError.message);
            }

            // Process each detail item to get its descriptions
            const formattedItems = [];
            for (const item of detailItems as Tables<"resume_detail_items">[]) {
              // Fetch descriptions for this detail item
              const { data: descriptions, error: descError } = await supabase
                .from("resume_item_descriptions")
                .select("*")
                .eq("detail_item_id", item.id)
                .order("display_order", { ascending: true });

              if (descError) {
                throw new Error(descError.message);
              }

              // Format the detail item with its descriptions
              formattedItems.push({
                title: item.title,
                organization: item.subtitle,
                date: item.date_range,
                description: (
                  descriptions as Tables<"resume_item_descriptions">[]
                ).map((desc) => desc.description),
              });
            }

            // Add the section with its formatted detail items
            formattedSections.push({
              title: section.title,
              content: formattedItems,
            });
          }
        }

        // Create the complete resume data object
        const formattedResume: ResumeDataType = {
          name: resumeData.name,
          email: resumeData.email || "",
          phone: resumeData.phone || "",
          location: resumeData.location || "",
          summary: resumeData.summary || "",
          sections: formattedSections,
          locked_status: resumeData.locked_status,
        };

        setResume(formattedResume);
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
    const updatedMessages = [
      ...messages,
      {
        role: "user",
        parts: [{ text: messageContent }],
      },
    ];

    setMessages(updatedMessages);
    setTextInput("");

    // Add a temporary message to indicate AI is thinking
    setMessages((prev) => [
      ...prev,
      {
        role: "role",
        parts: [{ text: "..." }],
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
      const aiMessage = {
        role: "model",
        parts: [{ text: interviewerResponse }],
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
          role: "model",
          parts: [{ text: "Sorry, I encountered an error. Please try again." }],
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
    const messageContent = textInput.trim();

    const updatedMessages = [
      ...messages,
      {
        role: "user",
        parts: [{ text: messageContent }],
      },
    ];

    setMessages(updatedMessages);
    setTextInput("");

    // Add a temporary message to indicate AI is thinking
    setMessages((prev) => [
      ...prev,
      {
        role: "role",
        parts: [{ text: "..." }],
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
      const aiMessage = {
        role: "model",
        parts: [{ text: t("errors.resumeEditError") }],
      };

      setMessages((prev) => [...prev, aiMessage]);
    } else {
      const data = await response.json();
      const { updatedResume, aiResponse } = data;
      const aiMessage = {
        role: "model",
        parts: [{ text: aiResponse }],
      };

      setMessages((prev) => [...prev, aiMessage]);
      setResume(updatedResume);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const generateResume = async (conversationHistory: Content[]) => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/resume/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: conversationHistory }),
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
          role: "model",
          parts: [
            {
              text: t("errors.resumeGenerationError"),
            },
          ],
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
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.parts[0].text}
                      </ReactMarkdown>
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
                    className="w-full p-6 rounded-xl border dark:bg-gray-800/50 dark:border-gray-700 bg-white/50 backdrop-blur-sm flex items-center justify-center"
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
                      className="resize-none w-full p-4 rounded-xl border bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm dark:border-gray-700 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 transition-all duration-300 mb-2"
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
                          (!textInput.trim() && !isRecording) || isGenerating
                        }
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </div>
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
              ) : resumeId && resume ? (
                resume.locked_status === "locked" && !hasSubscription ? (
                  <LockedResumeOverlay
                    hasCredits={credits >= 1}
                    requiredCredits={1}
                    resumeId={resumeId}
                    onUnlock={() => {
                      fetchResumeData(resumeId);
                    }}
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
