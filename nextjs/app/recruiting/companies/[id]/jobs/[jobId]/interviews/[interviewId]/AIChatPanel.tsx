"use client";

import { useRef, useEffect, useState, useMemo, useActionState } from "react";
import { useChat } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Send, Loader2, Bot, User, Save, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import Markdown from "react-markdown";
import {
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/utils/supabase/database.types";
import { QuestionCard } from "@/components/recruiting/QuestionCard";
import { saveQuestions, SaveQuestionsState } from "./actions";
import { toast } from "sonner";
import { InterviewQuestion } from "./page";

type QuestionBankInsert = TablesInsert<"company_interview_question_bank">;
type QuestionBankUpdate = TablesUpdate<"company_interview_question_bank">;
export type Question = QuestionBankInsert | QuestionBankUpdate | Tables<"company_interview_question_bank">;

export type ToolResponse = {
  questions: Question[];
  action: "CREATE";
};

const renderToolResponse = (response: ToolResponse) => {
  switch (response.action) {
    case "CREATE":
      return (
        <div className="space-y-3">
          {response.questions.map((q: Question, index: number) => (
            <QuestionCard key={index} question={q} />
          ))}
        </div>
      );
    default:
      return <pre className="text-sm">{JSON.stringify(response, null, 2)}</pre>;
  }
};

interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  interview: Tables<"job_interviews">;
  jobId: string;
  jobTitle: string;
  companyId: string;
  existingQuestions?: InterviewQuestion[];
}

export default function AIChatPanel({
  isOpen,
  onClose,
  interview,
  jobId,
  jobTitle,
  companyId,
  existingQuestions = [],
}: AIChatPanelProps) {
  const { messages, input, handleInputChange, handleSubmit, status } = useChat({
    api: "/api/recruiting/questions/edit",
    body: {
      jobId,
      existingQuestions,
    },
    initialMessages: [
      {
        id: "1",
        role: "assistant",
        content: `Hi! I'm your AI assistant. I can help you create interview questions for the ${jobTitle} position. What kind of questions would you like to add?`,
      },
    ],
    maxSteps: 5,
  });
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingQuestions, setPendingQuestions] = useState<Question[]>([]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Extract pending questions from messages
  useMemo(() => {
    // Traverse messages in reverse to get the latest state
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      if (message.role === "assistant") {
        for (const part of message.parts) {
          if (part.type === "tool-invocation") {
            const toolResult = (part as any).toolInvocation;
            const toolResultData = toolResult.result?.data as ToolResponse;
            if (toolResultData && toolResultData.action === "CREATE") {
              // Found CREATE action, use these questions as the latest
              setPendingQuestions(toolResultData.questions);
              return;
            }
          }
        }
      }
    }

    // No CREATE actions found
    setPendingQuestions([]);
  }, [messages]);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || status !== "ready") return;
    handleSubmit(e);
  };

  const [saveState, saveAction, isPending] = useActionState<
    SaveQuestionsState | null,
    FormData
  >(saveQuestions, null);

  // Handle save error with toast
  useEffect(() => {
    if (saveState?.error) {
      toast.error(saveState.error);
    } else if (saveState?.success) {
      toast.success("Questions saved successfully");
      setPendingQuestions([]);
    }
  }, [saveState]);

  const handleDiscardChanges = () => {
    setPendingQuestions([]);
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Chat Panel */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-background border-l shadow-2xl transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">AI Assistant</h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === "assistant" && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg px-3 py-2",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    {message.parts.map((part, i) => {
                      if (part.type === "text") {
                        return (
                          <div
                            key={`${message.id}-${i}`}
                            className={cn(
                              "markdown text-sm prose",
                              message.role === "user"
                                ? "text-primary-foreground"
                                : "text-secondary-foreground"
                            )}
                          >
                            <Markdown>{part.text}</Markdown>
                          </div>
                        );
                      }
                      if (part.type === "tool-invocation") {
                        const toolResult = (part as any).toolInvocation;
                        const toolResultData = toolResult.result
                          ?.data as ToolResponse;
                        if (toolResultData) {
                          const rendered = renderToolResponse(toolResultData);
                          return (
                            <pre
                              key={`${message.id}-${i}`}
                              className="text-sm whitespace-pre-wrap break-words overflow-x-auto"
                            >
                              {rendered}
                            </pre>
                          );
                        }
                      }
                      return null;
                    })}
                  </div>
                  {message.role === "user" && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}
              {status === "streaming" && (
                <div className="flex gap-3 justify-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-muted rounded-lg px-3 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Save/Discard Changes Bar */}
          {pendingQuestions.length > 0 && (
            <div className="px-2 py-1 border-t bg-muted/50">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {pendingQuestions.length} question
                  {pendingQuestions.length > 1 ? "s" : ""} pending
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleDiscardChanges}
                    className="gap-1"
                  >
                    <XCircle className="h-4 w-4" />
                    Discard changes
                  </Button>
                  <form action={saveAction}>
                    <input
                      type="hidden"
                      name="questions"
                      value={JSON.stringify(pendingQuestions)}
                    />
                    <input type="hidden" name="jobId" value={jobId} />
                    <input type="hidden" name="companyId" value={companyId} />
                    <input type="hidden" name="interviewId" value={interview.id} />
                    <Button
                      variant="default"
                      size="sm"
                      type="submit"
                      disabled={isPending}
                      className="gap-1"
                    >
                      {isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {isPending ? "Saving..." : "Save changes"}
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Input */}
          <form onSubmit={onSubmit} className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                placeholder="Type your message..."
                disabled={status !== "ready"}
                className="flex-1"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || status !== "ready"}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
