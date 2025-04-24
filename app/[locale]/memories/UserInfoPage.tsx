"use client";

import { ChatUI } from "@/app/components/chat/ChatUI";
import { TtsProvider } from "@/app/context/TtsContext";
import { Card } from "@/components/ui/card";
import { CoreMessage } from "ai";
import { useState, useCallback, useEffect } from "react";
import { MemoriesView } from "./components/Memories";
import { motion } from "framer-motion";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { useUser } from "@/context/UserContext";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";
import { Tables } from "@/utils/supabase/database.types";
import { useKnowledgeBase } from "@/app/context/KnowledgeBaseContext";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { FileText, MessageSquare, Users } from "lucide-react";
import { useRouter } from "next/navigation";

const _UserInfoPage = ({ isOnboarding }: { isOnboarding: boolean }) => {
  const t = useTranslations("knowledgeBase");
  const router = useRouter();
  const [generatingResponse, setGeneratingResponse] = useState(false);
  const [files, setFiles] = useState<Tables<"user_files">[]>([]);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [messages, setMessages] = useState<CoreMessage[]>([
    {
      role: "assistant",
      content: isOnboarding
        ? t("initialOnboardingMessage")
        : t("initialMessage"),
    },
  ]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const { logError } = useAxiomLogging();
  const user = useUser();
  const {
    knowledgeBase,
    isUpdatingKnowledgeBase,
    updateKnowledgeBase,
    setKnowledgeBase,
    setIsUpdatingKnowledgeBase,
  } = useKnowledgeBase();

  // Effect to show congratulations modal
  useEffect(() => {
    if (
      isOnboarding &&
      messages.length > 1 &&
      knowledgeBase !== null &&
      !showCongratulations
    ) {
      setShowCongratulations(true);
    }
  }, [isOnboarding, messages.length, knowledgeBase, showCongratulations]);

  const fetchFiles = useCallback(async () => {
    if (!user) return;
    const supabase = createSupabaseBrowserClient();

    const { data: filesData, error } = await supabase
      .from("user_files")
      .select("*")
      .eq("added_to_memory", true)
      .eq("user_id", user.id);

    if (error) {
      logError("Error fetching files", {
        error: error.message,
      });
      return;
    }
    setFiles(filesData);
  }, [user, logError]);

  const fetchKnowledgeBase = useCallback(async () => {
    if (!user) return;
    const supabase = createSupabaseBrowserClient();
    try {
      const { data: knowledgeBaseData } = await supabase
        .from("user_knowledge_base")
        .select("knowledge_base")
        .eq("user_id", user.id)
        .maybeSingle();

      setKnowledgeBase(knowledgeBaseData?.knowledge_base || null);
    } catch (error) {
      logError("Error fetching knowledge base", {
        error: error instanceof Error ? error.message : String(error),
      });
      setKnowledgeBase(null);
    }
  }, [user, logError, setKnowledgeBase]);

  const handleSendMessage = async (message: string, files?: File[]) => {
    setGeneratingResponse(true);
    const displayMessage =
      message.trim() || (files && files.length > 0)
        ? message.trim() || "*User has uploaded files*"
        : message;

    const updatedMessages = [
      ...messages,
      { role: "user" as const, content: displayMessage },
    ];
    setMessages(updatedMessages);

    const formData = new FormData();
    formData.append("messages", JSON.stringify(updatedMessages));
    formData.append("isOnboarding", String(isOnboarding));
    if (conversationId) {
      formData.append("conversationId", conversationId);
    }
    if (files) {
      files.forEach((file) => {
        formData.append("files", file);
      });
    }
    // Add initial empty assistant message
    setMessages((prevMessages) => [
      ...prevMessages,
      { role: "assistant", content: "" },
    ]);

    const response = await fetch("/api/memories/chat", {
      method: "POST",
      body: formData,
    });
    setGeneratingResponse(false);

    // Update knowledge base with the new message
    if (message.trim() || (files && files.length > 0)) {
      void updateKnowledgeBase(updatedMessages);
    }

    // If files were uploaded, refresh the files list
    if (files && files.length > 0) {
      try {
        await fetchFiles();
      } catch (error) {
        logError("Error refreshing files after upload", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    if (!response.body) {
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        },
      ]);
      return;
    }

    // Get conversationId from headers if it's a new conversation
    if (!conversationId) {
      const newConversationId = response.headers.get("X-Conversation-Id");
      if (newConversationId) {
        setConversationId(newConversationId);
      }
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let done = false;
    let accumulatedResponse = "";
    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunk = decoder.decode(value, { stream: true });
      accumulatedResponse += chunk;

      // Update the last message with the accumulated response
      setMessages((prevMessages) => {
        const newMessages = [...prevMessages];
        newMessages[newMessages.length - 1] = {
          role: "assistant",
          content: accumulatedResponse,
        };
        return newMessages;
      });
    }

    return {
      message: accumulatedResponse,
      index: messages.length,
    };
  };

  const handleContinue = () => {
    setShowCongratulations(false);
    // Remove the onboarding parameter from the URL
    const url = new URL(window.location.href);
    url.searchParams.delete("onboarding");
    router.replace(url.pathname);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Dialog open={showCongratulations} onOpenChange={setShowCongratulations}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">
              {t("congratulations")}
            </DialogTitle>
            <DialogDescription className="text-center text-lg">
              {t("congratulationsDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-6">
            <Link href="/dashboard/resumes">
              <Card className="flex items-center gap-6 p-6 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex-shrink-0">
                  <FileText className="w-8 h-8 text-blue-500" />
                </div>
                <div className="flex-grow text-left">
                  <h4 className="text-xl font-semibold text-gray-900 mb-1">
                    {t("buildResume")}
                  </h4>
                  <p className="text-gray-600">{t("buildResumeDescription")}</p>
                </div>
              </Card>
            </Link>
            <Link href="/dashboard/jobs">
              <Card className="flex items-center gap-6 p-6 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex-shrink-0">
                  <MessageSquare className="w-8 h-8 text-purple-500" />
                </div>
                <div className="flex-grow text-left">
                  <h4 className="text-xl font-semibold text-gray-900 mb-1">
                    {t("prepareInterview")}
                  </h4>
                  <p className="text-gray-600">
                    {t("prepareInterviewDescription")}
                  </p>
                </div>
              </Card>
            </Link>
            <Link href="/dashboard/interviewCopilot">
              <Card className="flex items-center gap-6 p-6 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex-shrink-0">
                  <Users className="w-8 h-8 text-green-500" />
                </div>
                <div className="flex-grow text-left">
                  <h4 className="text-xl font-semibold text-gray-900 mb-1">
                    {t("interviewCopilot")}
                  </h4>
                  <p className="text-gray-600">
                    {t("interviewCopilotDescription")}
                  </p>
                </div>
              </Card>
            </Link>
          </div>
          <DialogFooter className="flex justify-center sm:justify-center">
            <Button
              onClick={handleContinue}
              className="w-full sm:w-auto"
              size="lg"
            >
              {t("continue")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="flex-1 flex flex-col lg:flex-row gap-4 md:gap-8 p-4 md:p-8 overflow-hidden max-w-[2000px] mx-auto w-full h-full">
        {/* Chat UI column */}
        <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
          <Card className="flex-1 flex flex-col overflow-hidden min-h-0">
            <ChatUI
              messages={messages}
              onSendMessage={handleSendMessage}
              showTtsControls={true}
              showFileSelector={true}
              isProcessing={generatingResponse}
            />
          </Card>
        </div>

        {/* Knowledge Base column */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex-1 flex flex-col h-full overflow-hidden min-w-0"
        >
          <Card className="flex-1 overflow-hidden min-h-0">
            <MemoriesView
              isUpdatingKnowledgeBase={isUpdatingKnowledgeBase}
              setIsUpdatingKnowledgeBase={setIsUpdatingKnowledgeBase}
              fetchFiles={fetchFiles}
              files={files}
              knowledgeBase={knowledgeBase}
              setKnowledgeBase={setKnowledgeBase}
              fetchKnowledgeBase={fetchKnowledgeBase}
            />
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default function UserInfoPage({
  isOnboarding,
}: {
  isOnboarding: boolean;
}) {
  return (
    <TtsProvider>
      <_UserInfoPage isOnboarding={isOnboarding} />
    </TtsProvider>
  );
}
