"use client";

import { useState } from "react";
import { FileText, Users, MessageSquare } from "lucide-react";
import ResumeBuilder from "./dashboard/resumes/components/ResumeBuilder";

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
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const options = [
    {
      id: "resume",
      title: "Craft Your Resume",
      icon: FileText,
      description: "Build a professional resume in minutes",
    },
    {
      id: "interview",
      title: "Prep For Your Interview",
      icon: Users,
      description:
        "Go through mock interviews with our AI interviewer and get feedback on your performance",
    },
    {
      id: "assistant",
      title: "Crush Your Interview",
      icon: MessageSquare,
      description:
        "Our Interview Copilot listens in on your interview and helps you answer questions",
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
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="container mx-auto px-4 py-16">
        <h1 className="text-4xl md:text-5xl font-bold text-center text-gray-900 mb-4">
          I'm an assistant whose only goal is to help you land a job.
        </h1>

        <h2 className="text-2xl md:text-3xl text-center text-gray-600 mt-8 mb-16">
          How can I help?
        </h2>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => setSelectedOption(option.id)}
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
              <p className="text-gray-600">{option.description}</p>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
