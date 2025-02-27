"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import ResumePreview from "./components/ResumePreview";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ArrowUp, Mic, MicOff, Send } from "lucide-react";
import { useVoiceRecording } from "./components/useVoiceRecording";
import VoiceRecordingOverlay from "./components/VoiceRecordingOverlay";

interface Message {
  role: string;
  content: string;
  timestamp: Date;
}

export default function ResumeBuilderPage() {
  const t = useTranslations("resumeBuilder");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [textInput, setTextInput] = useState<string>("");
  const [generatedResume, setGeneratedResume] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isResumeReady, setIsResumeReady] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize the conversation with the first AI message
  useEffect(() => {
    setMessages([
      {
        role: "assistant",
        content:
          "Hi! I'll help you create a professional resume. Let's start with your full name. What is your name?",
        timestamp: new Date(),
      },
    ]);
  }, []);

  // Scroll to bottom of chat whenever messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const { startRecording, stopRecording, cancelRecording, isProcessing } =
    useVoiceRecording({
      onTranscription: (transcription: string) => {
        if (transcription.trim()) {
          setTextInput(transcription);
          setIsRecording(false);
          // No longer auto-sending the message after transcription
        }
      },
      t,
    });

  const handleRecordingToggle = () => {
    if (isRecording) {
      stopRecording();
      setIsRecording(false);
    } else {
      startRecording();
      setIsRecording(true);
    }
  };

  const handleTextInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextInput(e.target.value);
  };

  const sendMessage = async (transcription?: string) => {
    const messageContent = transcription || textInput;
    if (!messageContent.trim() || isGenerating) return;

    // Add user message to chat
    const updatedMessages = [
      ...messages,
      {
        role: "user",
        content: messageContent,
        timestamp: new Date(),
      },
    ];

    setMessages(updatedMessages);
    setTextInput("");

    // Simulate AI thinking
    setTimeout(async () => {
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

        const data = await response.json();

        // Add AI response to chat
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.message,
            timestamp: new Date(),
          },
        ]);

        // Check if resume is ready to be generated
        if (data.isResumeReady) {
          setIsResumeReady(true);
          generateResume(
            updatedMessages.concat([
              {
                role: "assistant",
                content: data.message,
                timestamp: new Date(),
              },
            ])
          );
        }
      } catch (error) {
        console.error("Error in AI conversation:", error);
        // Add error message
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Sorry, I encountered an error. Please try again.",
            timestamp: new Date(),
          },
        ]);
      }
    }, 500);
  };

  const handleSendButtonClick = () => {
    sendMessage();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const generateResume = async (conversationHistory: Message[]) => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/resume/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ conversation: conversationHistory }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setGeneratedResume(data.resume);

      // Add a message indicating resume is ready
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Great! I've created your resume based on our conversation. You can preview it on the right and download it when you're ready.",
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error("Error generating resume:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I'm having trouble generating your resume. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="p-6">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 px-6 pb-6 overflow-hidden">
        <div className="h-full flex flex-col">
          <Card className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex-1 flex flex-col overflow-hidden">
            <h2 className="text-xl font-semibold mb-4">{t("description")}</h2>

            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === "user"
                        ? "bg-gray-800 text-white dark:bg-gray-700"
                        : "bg-gray-200 dark:bg-gray-800"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Unified Input area */}
            <div className="w-full">
              <div className="relative">
                {isRecording ? (
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
                  />
                ) : isProcessing ? (
                  <div className="w-full p-4 rounded-lg border dark:bg-gray-800 dark:border-gray-700 bg-gray-50 flex items-center justify-center">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-800 dark:border-gray-700 dark:border-t-white" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {t("processing") || "Transcribing..."}
                      </span>
                    </div>
                  </div>
                ) : (
                  <Textarea
                    placeholder={t("typeYourResponse")}
                    value={textInput}
                    onChange={handleTextInputChange}
                    onKeyDown={handleKeyDown}
                    className="pr-24 resize-none w-full p-3 rounded-lg border dark:bg-gray-800 dark:border-gray-700"
                    rows={3}
                    disabled={isGenerating}
                  />
                )}
                {!isRecording && !isProcessing && (
                  <div className="absolute bottom-3 right-3 flex space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      className="h-8 w-8 rounded-full text-gray-500"
                      onClick={handleRecordingToggle}
                      disabled={isGenerating}
                    >
                      <Mic className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="h-8"
                      onClick={handleSendButtonClick}
                      disabled={
                        (!textInput.trim() && !isRecording) || isGenerating
                      }
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        <div className="h-full flex flex-col">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex-1 flex flex-col overflow-hidden">
            <h2 className="text-xl font-semibold mb-4">
              {t("downloadResume")}
            </h2>
            <div className="flex-1 overflow-y-auto">
              <ResumePreview resume={generatedResume} loading={isGenerating} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
