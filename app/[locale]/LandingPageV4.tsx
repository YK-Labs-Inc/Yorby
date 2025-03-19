"use client";

import { useState, useEffect } from "react";
import { FileText, Users, MessageSquare } from "lucide-react";
import ResumeBuilder from "./dashboard/resumes/components/ResumeBuilder";
import { InterviewCopilotCreationForm } from "./dashboard/interview-copilots/InterviewCopilotCreationForm";
import JobCreationComponent from "./JobCreationComponent";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";

export default function LandingPageV4({
  user,
  hasSubscription,
  credits,
  isSubscriptionVariant,
  isFreemiumEnabled,
  resumeBuilderRequiresEmail,
}: {
  user: any;
  hasSubscription: boolean;
  credits: number;
  isSubscriptionVariant: boolean;
  isFreemiumEnabled: boolean;
  resumeBuilderRequiresEmail: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedOption, setSelectedOption] = useState<string | null>(
    searchParams.get("option")
  );
  const t = useTranslations("landingPageV4");

  const updateOption = (optionId: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("option", optionId);
    router.push(`?${params.toString()}`);
    setSelectedOption(optionId);
  };

  // Update selected option when URL changes
  useEffect(() => {
    const option = searchParams.get("option");
    setSelectedOption(option);
  }, [searchParams]);

  const options = [
    {
      id: t("options.resume.id"),
      title: t("options.resume.title"),
      icon: FileText,
      description: [
        t("options.resume.description.line1"),
        t("options.resume.description.line2"),
      ],
    },
    {
      id: t("options.interview.id"),
      title: t("options.interview.title"),
      icon: Users,
      description: [
        t("options.interview.description.line1"),
        t("options.interview.description.line2"),
      ],
    },
    {
      id: t("options.assistant.id"),
      title: t("options.assistant.title"),
      icon: MessageSquare,
      description: [
        t("options.assistant.description.line1"),
        t("options.assistant.description.line2"),
      ],
    },
  ];

  // If resume option is selected, render the ResumeBuilder component
  if (selectedOption === "resume") {
    return (
      <ResumeBuilder
        hasSubscription={hasSubscription}
        credits={credits}
        user={user}
        isSubscriptionVariant={isSubscriptionVariant}
        isFreemiumEnabled={isFreemiumEnabled}
        resumeBuilderRequiresEmail={resumeBuilderRequiresEmail}
      />
    );
  } else if (selectedOption === "interview") {
    return (
      <div className="p-4">
        <JobCreationComponent />{" "}
      </div>
    );
  } else if (selectedOption === "assistant") {
    return (
      <div className="p-4">
        <InterviewCopilotCreationForm />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="container mx-auto px-4 py-16">
        <h1 className="text-4xl md:text-5xl font-bold text-center text-gray-900 mb-4">
          {t("title")}
        </h1>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => updateOption(option.id)}
              className={`
                p-6 rounded-xl border-2 transition-all duration-200
                ${
                  selectedOption === option.id
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
                }
              `}
            >
              <option.icon className="h-8 w-8 mb-4 text-indigo-500 mx-auto" />
              <h3 className="text-xl font-semibold mb-2 text-gray-900">
                {option.title}
              </h3>
              {option.description.map((description: string, index: number) => (
                <p key={index} className="text-gray-600 mb-2">
                  {description}
                </p>
              ))}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
