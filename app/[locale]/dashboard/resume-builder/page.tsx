"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AiSuggestions from "./components/AiSuggestions";
import ResumePreview from "./components/ResumePreview";
import TextInput from "./components/TextInput";
import VoiceInput from "./components/VoiceInput";

export default function ResumeBuilderPage() {
  const t = useTranslations("resumeBuilder");
  const [activeTab, setActiveTab] = useState<string>("voice");
  const [resumeText, setResumeText] = useState<string>("");
  const [generatedResume, setGeneratedResume] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [conversation, setConversation] = useState<
    Array<{ role: string; content: string }>
  >([]);

  const handleTextChange = (text: string) => {
    setResumeText(text);
  };

  const handleVoiceInput = (transcription: string) => {
    setResumeText(transcription);
  };

  const generateResume = async () => {
    if (!resumeText.trim()) return;

    setIsGenerating(true);
    try {
      const response = await fetch("/api/resume/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: resumeText }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setGeneratedResume(data.resume);

      // Initialize conversation with system message and user input
      setConversation([
        {
          role: "system",
          content:
            "I'm an AI assistant helping you improve your resume. I'll provide suggestions based on your input.",
        },
        {
          role: "user",
          content: resumeText,
        },
        {
          role: "assistant",
          content:
            "I've created a resume based on your information. You can now refine it by asking me to make specific changes or improvements.",
        },
      ]);
    } catch (error) {
      console.error("Error generating resume:", error);
      alert(t("Something went wrong. Please try again."));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t("resumeBuilder")}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              {t("inputYourInformation")}
            </h2>
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="voice">{t("voiceInput")}</TabsTrigger>
                <TabsTrigger value="text">{t("textInput")}</TabsTrigger>
              </TabsList>
              <TabsContent value="voice" className="mt-4">
                <VoiceInput onTranscription={handleVoiceInput} />
              </TabsContent>
              <TabsContent value="text" className="mt-4">
                <TextInput value={resumeText} onChange={handleTextChange} />
              </TabsContent>
            </Tabs>

            <div className="mt-6">
              <Button
                onClick={generateResume}
                disabled={!resumeText.trim() || isGenerating}
                className="w-full"
              >
                {isGenerating ? t("generating") : t("generateResume")}
              </Button>
            </div>
          </div>

          {generatedResume && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">
                {t("aiSuggestions")}
              </h2>
              <AiSuggestions
                conversation={conversation}
                setConversation={setConversation}
                onUpdateResume={(updatedResume) =>
                  setGeneratedResume(updatedResume)
                }
              />
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">{t("resumePreview")}</h2>
          <ResumePreview resume={generatedResume} loading={isGenerating} />
        </div>
      </div>
    </div>
  );
}
