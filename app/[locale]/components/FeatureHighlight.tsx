"use client";

import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";

interface FeatureProps {
  id: keyof typeof FEATURE_IDS;
  icon: React.ReactNode;
  img: string;
}

const FEATURE_IDS = {
  practiceQuestions: "practiceQuestions",
  feedback: "feedback",
  aiAnswers: "aiAnswers",
  mockInterviews: "mockInterviews",
  performance: "performance",
  pricing: "pricing",
} as const;

const features: FeatureProps[] = [
  {
    id: "practiceQuestions",
    icon: "🎯",
    img: "/assets/unlimited-practice-questions.png",
  },
  {
    id: "feedback",
    icon: "💡",
    img: "/assets/answer-feedback.png",
  },
  {
    id: "aiAnswers",
    icon: "🤖",
    img: "/assets/generate-answers.png",
  },
  {
    id: "mockInterviews",
    icon: "🗣️",
    img: "/assets/mock-interview-demo.png",
  },
  {
    id: "performance",
    icon: "📊",
    img: "/assets/interview-feedback.png",
  },
  {
    id: "pricing",
    icon: "💸",
    img: "/assets/purchase-page.png",
  },
];

export default function FeatureHighlight() {
  const t = useTranslations("landingPage");

  return (
    <div className="w-full max-w-[1080px] mx-auto px-4 py-4">
      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          {t("featureHighlightTitle")}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {features.map((feature) => (
          <Card
            key={feature.id}
            className="overflow-hidden bg-white rounded-3xl border shadow-sm hover:shadow-lg transition-shadow flex flex-col justify-between"
          >
            <div className="p-8">
              <div className="mb-6">
                <span className="text-4xl">{feature.icon}</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">
                {t(`features.${feature.id}.title`)}
              </h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {t(`features.${feature.id}.description`)}
              </p>
            </div>

            <div className="relative bg-transparent">
              <img
                src={feature.img}
                alt={t(`features.${feature.id}.title`)}
                className="w-full h-full object-cover rounded-lg bg-transparent"
              />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
