"use client";

import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";

interface FeatureProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  img: string;
}

const features: FeatureProps[] = [
  {
    title: "Unlimited Practice Questions",
    description:
      "Generate unlimited practice interview questions based off of any job description and your resume so that the questions are custom to the job and your personal experience",
    icon: "🎯",
    img: "/assets/unlimited-practice-questions.png",
  },
  {
    title: "Instant Feedback",
    description: "Get feedback on your answers to practice interview questions",
    icon: "💡",
    img: "/assets/answer-feedback.png",
  },
  {
    title: "AI-Powered Answers",
    description:
      "Too lazy? Generate answers to practice interview questions based off of your previous work history",
    icon: "🤖",
    img: "/assets/generate-answers.png",
  },
  {
    title: "Realistic Mock Interviews",
    description:
      "Realistic mock interview experience by making you chat back and forth with an AI interviewer to replicate a real life interview scenario",
    icon: "🗣️",
    img: "/assets/mock-interview-demo.png",
  },
  {
    title: "Performance Analysis",
    description: "Get a detailed breakdown on your mock interview performance",
    icon: "📊",
    img: "/assets/interview-feedback.png",
  },
  {
    title: "No Subscription Required",
    description: "No subscription required, just pay for what you need",
    icon: "💸",
    img: "/assets/purchase-page.png",
  },
];

export default function FeatureHighlight() {
  const t = useTranslations("landingPage");
  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          {t("featureHighlightTitle")}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
        {features.map((feature, index) => (
          <Card
            key={index}
            className="overflow-hidden bg-white rounded-3xl border shadow-sm hover:shadow-lg transition-shadow flex flex-col justify-between"
          >
            <div className="p-8">
              <div className="mb-6">
                <span className="text-4xl">{feature.icon}</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>

            <div className="relative bg-transparent">
              <img
                src={feature.img}
                alt={feature.title}
                className="w-full h-full object-cover rounded-lg bg-transparent"
              />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
