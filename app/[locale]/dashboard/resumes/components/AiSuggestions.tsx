"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Message {
  role: string;
  content: string;
}

interface AiSuggestionsProps {
  conversation: Message[];
  setConversation: (conversation: Message[]) => void;
  onUpdateResume: (updatedResume: any) => void;
}

export default function AiSuggestions({
  conversation,
  setConversation,
  onUpdateResume,
}: AiSuggestionsProps) {
  const t = useTranslations("resumeBuilder");
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat whenever conversation updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    // Add user message to conversation
    const updatedConversation = [
      ...conversation,
      { role: "user", content: input },
    ];
    setConversation(updatedConversation);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/resume/refine", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ conversation: updatedConversation }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();

      // Add AI response to conversation
      setConversation([
        ...updatedConversation,
        { role: "assistant", content: data.message },
      ]);

      // Update resume if changes were made
      if (data.updatedResume) {
        onUpdateResume(data.updatedResume);
      }
    } catch (error) {
      console.error("Error getting AI response:", error);
      // Add error message to conversation
      setConversation([
        ...updatedConversation,
        {
          role: "assistant",
          content: t("generalError"),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Filter out system messages from display
  const displayMessages = conversation.filter(
    (message) => message.role !== "system"
  );

  return (
    <div className="flex flex-col h-[400px]">
      <div className="flex-grow overflow-y-auto mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-md">
        {displayMessages.length > 0 ? (
          <div className="space-y-4">
            {displayMessages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-gray-200 dark:bg-gray-800"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>{t("suggestionsPrompt")}</p>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("suggestionsPlaceholder")}
          className="resize-none"
          rows={2}
          disabled={isLoading}
        />
        <Button
          onClick={handleSendMessage}
          disabled={!input.trim() || isLoading}
          className="h-auto"
        >
          {isLoading ? (
            <span className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin"></span>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          )}
        </Button>
      </div>
    </div>
  );
}
