"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import ResumePreview from "./components/ResumePreview";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Mic, Send } from "lucide-react";
import { useVoiceRecording } from "./components/useVoiceRecording";
import VoiceRecordingOverlay from "./components/VoiceRecordingOverlay";
import { Content } from "@google/generative-ai";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";

export default function ResumeBuilderPage() {
  const t = useTranslations("resumeBuilder");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [textInput, setTextInput] = useState<string>("");
  const [generatedResumeId, setGeneratedResumeId] = useState<string>();
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isResumeReady, setIsResumeReady] = useState<boolean>(false);
  const [messages, setMessages] = useState<Content[]>(conversationHistory);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { logError } = useAxiomLogging();

  // Initialize the conversation with the first AI message
  // useEffect(() => {
  //   setMessages([
  //     {
  //       role: "model",
  //       parts: [
  //         {
  //           text: "Hi! I'll help you create a professional resume. Let's start with your full name. What is your name?",
  //         },
  //       ],
  //     },
  //   ]);
  // }, []);

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
    isInitialized,
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

  const sendMessage = async (transcription?: string) => {
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
    <div className="h-screen flex flex-col overflow-hidden">
      <div
        className={`flex-1 grid ${shouldShowSplitView ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"} gap-6 px-6 pb-6 overflow-hidden`}
      >
        {/* Chat UI column - always shown */}
        <div
          className={`min-h-0 flex flex-col ${shouldShowSplitView ? "" : "lg:col-span-2 max-w-3xl mx-auto w-full"}`}
        >
          <Card className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex-1 flex flex-col min-h-0">
            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4 min-h-0">
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
                    {message.parts[0].text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

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
                    audioDevices={audioDevices}
                    selectedAudio={selectedAudio}
                    onSelectAudio={(deviceId) => setSelectedAudio(deviceId)}
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

        {/* Resume preview column - only shown when a resume exists */}
        {shouldShowSplitView && (
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto">
              <ResumePreview
                resumeId={generatedResumeId}
                loading={isGenerating}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const conversationHistory = [
  {
    role: "model",
    parts: [
      {
        text: "Hi! I'll help you create a professional resume. Let's start with your full name. What is your name?",
      },
    ],
  },
  {
    role: "user",
    parts: [
      {
        text: "My name is Thomas Kim.\n",
      },
    ],
  },
  {
    role: "model",
    parts: [
      {
        text: "Thanks, Thomas! What is your email address?",
      },
    ],
  },
  {
    role: "user",
    parts: [
      {
        text: "97thomas@gmail.com.\n",
      },
    ],
  },
  {
    role: "model",
    parts: [
      {
        text: "Thanks, Thomas! What is your phone number?",
      },
    ],
  },
  {
    role: "user",
    parts: [
      {
        text: "714-365-9744.\n",
      },
    ],
  },
  {
    role: "model",
    parts: [
      {
        text: "Thanks, Thomas! What is your current location?",
      },
    ],
  },
  {
    role: "user",
    parts: [
      {
        text: "Chicago, Illinois.\n",
      },
    ],
  },
  {
    role: "model",
    parts: [
      {
        text: "Thanks, Thomas! Let's move on to your education. Could you tell me the name of the school you attended, the degree you obtained, your graduation year, and your GPA?",
      },
    ],
  },
  {
    role: "user",
    parts: [
      {
        text: "I went to Dartmouth College with a Bachelor of Arts in Computer Science and my GPA was a 3.49. I went to school from September 25th to June 2019.\n",
      },
    ],
  },
  {
    role: "model",
    parts: [
      {
        text: "Do you have any other educational experiences to add?",
      },
    ],
  },
  {
    role: "user",
    parts: [
      {
        text: "Nope, that's it.\n",
      },
    ],
  },
  {
    role: "model",
    parts: [
      {
        text: "Okay, let's move on to your work experience. Could you tell me the name of the company you worked for, your job title, your start date, your end date, and what you did at the company?",
      },
    ],
  },
  {
    role: "user",
    parts: [
      {
        text: "So, I currently work at Instacart. I started working here in July 2021, and I'm a software engineer, senior software engineer actually. And while I was here, I have worked as both a full stack engineer as well as an iOS mobile engineer, which I learned while on the job. I've worked on a various amount of projects while I was here.",
      },
    ],
  },
  {
    role: "model",
    parts: [
      {
        text: "Could you provide a few bullet points describing your responsibilities and accomplishments at Instacart?",
      },
    ],
  },
  {
    role: "user",
    parts: [
      {
        text: "Yeah, so I led to actually, yeah, no, I worked on a project to help scale display advertisement such as banners and shoppable displays, uh, as a business from maybe $10 million a year revenue to currently almost $100 million of recurring revenue.\nI was primarily the lead front-end engineer to help build these formats, worked very closely with design and product to create these innovative formats to constantly increase advertiser return on ad spend, ROAS, as well as click through rate, add to cart rates, and stuff like that.",
      },
    ],
  },
  {
    role: "model",
    parts: [
      {
        text: "Do you have any more work experiences that you would like to add?",
      },
    ],
  },
  {
    role: "user",
    parts: [
      {
        text: "no",
      },
    ],
  },
  {
    role: "model",
    parts: [
      {
        text: "Okay, let's move on to your skills. Could you tell me the skills that you are most proficient in?",
      },
    ],
  },
  {
    role: "user",
    parts: [
      {
        text: "nextjs, react, expo, typescript, kafka",
      },
    ],
  },
  {
    role: "model",
    parts: [
      {
        text: "Thanks for chatting — I'll generate your resume now.",
      },
    ],
  },
];
