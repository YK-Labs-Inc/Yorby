"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import ResumePreview from "./ResumePreview";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Mic, Send } from "lucide-react";
import { useVoiceRecording } from "./useVoiceRecording";
import VoiceRecordingOverlay from "./VoiceRecordingOverlay";
import { Content } from "@google/generative-ai";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { Tables } from "@/utils/supabase/database.types";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

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
};

export default function ResumeBuilder({ resumeId }: { resumeId?: string }) {
  const t = useTranslations("resumeBuilder");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [textInput, setTextInput] = useState<string>("");
  const [generatedResumeId, setGeneratedResumeId] = useState<string>(
    resumeId || ""
  );
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isResumeReady, setIsResumeReady] = useState<boolean>(false);
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

  useEffect(() => {
    // If resumeId is provided, fetch the resume data
    if (generatedResumeId) {
      const fetchResumeData = async () => {
        setIsGenerating(true);
        try {
          const supabase = createSupabaseBrowserClient();

          // Fetch basic resume data
          const { data: resumeData, error: resumeError } = await supabase
            .from("resumes")
            .select("*")
            .eq("id", generatedResumeId)
            .single();

          if (resumeError || !resumeData) {
            throw new Error(resumeError?.message || "Resume not found");
          }

          // Fetch resume sections
          const { data: sectionsData, error: sectionsError } = await supabase
            .from("resume_sections")
            .select("*")
            .eq("resume_id", generatedResumeId)
            .order("display_order", { ascending: true });

          if (sectionsError) {
            throw new Error(sectionsError.message);
          }

          // Create an array to hold all section data with their content
          const formattedSections = [];

          // Process each section
          for (const section of sectionsData as Tables<"resume_sections">[]) {
            // Check if it's a skills section (usually just list items)
            const isSkillsSection = section.title
              .toLowerCase()
              .includes("skill");

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
          };

          setResume(formattedResume);
        } catch (error) {
          console.error("Error fetching resume data:", error);
          setResume(null);
        } finally {
          setIsGenerating(false);
        }
      };

      fetchResumeData();
    }
  }, [generatedResumeId]);

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
        setIsResumeReady(true);
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
    if (generatedResumeId) {
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
      setGeneratedResumeId(resumeId);
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          parts: [
            {
              text: `Great! I've created your resume based on our conversation. You can preview it on the right. If you want 
              to make any modifications, just let me know and I'll update it for you.`,
            },
          ],
        },
      ]);
    } catch (error) {
      logError("Error generating resume:", { error });
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          parts: [
            {
              text: "I'm having trouble generating your resume. Please try again.",
            },
          ],
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const shouldShowSplitView = generatedResumeId;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div
        className={`flex-1 grid ${
          shouldShowSplitView ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
        } gap-8 p-8 overflow-hidden max-w-[2000px] mx-auto w-full`}
      >
        {/* Chat UI column - always shown */}
        <div
          className={`min-h-0 flex flex-col ${
            shouldShowSplitView ? "" : "lg:col-span-2 max-w-3xl mx-auto w-full"
          }`}
        >
          <Card className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 flex-1 flex flex-col min-h-0 border-0 transition-all duration-300">
            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto space-y-6 p-4 rounded-xl mb-4 min-h-0 custom-scrollbar">
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
                      <p className="text-sm md:text-base leading-relaxed">
                        {message.parts[0].text}
                      </p>
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
                  <div className="relative transition-all duration-300 hover:transform hover:scale-[1.01]">
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

        {/* Resume preview column - only shown when a resume exists */}
        {shouldShowSplitView && resume && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="h-full flex flex-col"
          >
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <ResumePreview resume={resume} loading={isGenerating} />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
