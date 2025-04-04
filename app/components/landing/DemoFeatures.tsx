"use client";

import { InterviewCopilotCreationForm } from "@/app/[locale]/dashboard/interview-copilots/InterviewCopilotCreationForm";
import ResumeBuilder from "@/app/[locale]/dashboard/resumes/components/ResumeBuilder";
import JobCreationComponent from "@/app/[locale]/JobCreationComponent";
import { FileText, Users, MessageSquare } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DemoFeatures({
  user,
  hasSubscription,
  credits,
  isSubscriptionVariant,
  isFreemiumEnabled,
  transformResumeEnabled,
}: {
  user: any;
  hasSubscription: boolean;
  credits: number;
  isSubscriptionVariant: boolean;
  isFreemiumEnabled: boolean;
  transformResumeEnabled: boolean;
}) {
  const [selectedOption, setSelectedOption] = useState<string | null>("resume");
  const t = useTranslations("LandingPageV5.demoFeatures");

  const options = [
    {
      id: "resume",
      title: t("options.resume.title"),
      icon: FileText,
    },
    {
      id: "interview",
      title: t("options.interview.title"),
      icon: Users,
    },
    {
      id: "assistant",
      title: t("options.assistant.title"),
      icon: MessageSquare,
    },
  ];

  const renderContent = () => {
    if (selectedOption === "resume") {
      return (
        <ResumeBuilder
          hasSubscription={hasSubscription}
          credits={credits}
          user={user}
          isSubscriptionVariant={isSubscriptionVariant}
          isFreemiumEnabled={isFreemiumEnabled}
          transformResumeEnabled={transformResumeEnabled}
        />
      );
    } else if (selectedOption === "interview") {
      return (
        <div className="p-4">
          <JobCreationComponent />
        </div>
      );
    } else if (selectedOption === "assistant") {
      return (
        <div className="p-4">
          <InterviewCopilotCreationForm />
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full max-w-[1080px] mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center mb-8"
        >
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
            {t("title")}
          </h2>
          <p className="text-muted-foreground text-lg">{t("subtitle")}</p>
        </motion.div>

        <Tabs
          defaultValue={selectedOption || "resume"}
          onValueChange={(value) => setSelectedOption(value)}
          className="w-full max-w-3xl"
        >
          <TabsList className="grid w-full grid-cols-3 h-auto p-2 bg-background rounded-xl border shadow-sm">
            {options.map((option) => (
              <TabsTrigger
                key={option.id}
                value={option.id}
                className="flex items-center gap-2 py-4 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all"
              >
                <option.icon className="h-5 w-5" />
                <span className="hidden sm:inline font-medium">
                  {option.title}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <motion.div
          key={selectedOption}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full mt-8"
        >
          {renderContent()}
        </motion.div>
      </motion.div>
    </div>
  );
}
