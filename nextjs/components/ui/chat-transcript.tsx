"use client";

import { cn } from "@/lib/utils";
import { format } from "date-fns";

export interface ChatMessage {
  id: string;
  role: "user" | "model" | "assistant" | "interviewer";
  text: string;
  created_at: string;
}

interface ChatTranscriptProps {
  messages: ChatMessage[];
  className?: string;
  userLabel?: string;
  assistantLabel?: string;
  showTimestamps?: boolean;
  formatTimestamp?: (date: string) => string;
  maxHeight?: string;
}

export function ChatTranscript({
  messages,
  className,
  userLabel = "You",
  assistantLabel = "Assistant",
  showTimestamps = true,
  formatTimestamp,
  maxHeight = "max-h-96",
}: ChatTranscriptProps) {
  const defaultFormatTimestamp = (dateString: string) => {
    return format(new Date(dateString), "h:mm:ss a");
  };

  const formatTime = formatTimestamp || defaultFormatTimestamp;

  const getLabel = (role: string) => {
    switch (role) {
      case "user":
        return userLabel;
      case "model":
      case "assistant":
      case "interviewer":
        return assistantLabel;
      default:
        return role;
    }
  };

  const isUserMessage = (role: string) => role === "user";

  return (
    <div className={cn("border rounded-lg overflow-hidden", className)}>
      <div className={cn("overflow-y-auto", maxHeight)}>
        <div className="p-4 space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "p-3 rounded-lg",
                isUserMessage(message.role)
                  ? "bg-black text-white ml-8 mr-0"
                  : "bg-gray-100 ml-0 mr-8"
              )}
            >
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-xs font-medium">
                  {getLabel(message.role)}
                </span>
                {showTimestamps && (
                  <span
                    className={cn(
                      "text-xs",
                      isUserMessage(message.role)
                        ? "text-gray-300"
                        : "text-gray-500"
                    )}
                  >
                    {formatTime(message.created_at)}
                  </span>
                )}
              </div>
              <p className="text-sm whitespace-pre-wrap">{message.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
