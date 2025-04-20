"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BookOpen,
  FileText,
  MessageSquare,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { completeOnboarding } from "./actions";

const steps = [
  {
    title: "welcome",
    icon: "✨",
  },
  {
    title: "knowledgeBase",
    icon: "📚",
  },
  {
    title: "toolkit",
    icon: "🛠️",
  },
  {
    title: "testimonials",
    icon: "🌟",
  },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();
  const t = useTranslations("onboardingV2");

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding().then(() => {
        router.push("/memories?onboarding=true");
      });
    }
  };

  const renderStepContent = (step: string) => {
    switch (step) {
      case "welcome":
      case "knowledgeBase":
        return (
          <div className="space-y-2">
            {t
              .raw(`steps.${step}.content`)
              .map((line: string, index: number) => (
                <p key={index} className="text-lg text-gray-700">
                  {line}
                </p>
              ))}
          </div>
        );
      case "toolkit":
        return (
          <div className="space-y-2">
            <Card className="flex items-center gap-6 p-6">
              <div className="flex-shrink-0">
                <FileText className="w-8 h-8 text-blue-500" />
              </div>
              <div className="flex-grow text-left">
                <h4 className="text-xl font-semibold text-gray-900 mb-1">
                  {t("steps.toolkit.resumeBuilder.title")}
                </h4>
                <p className="text-gray-600 mb-1">
                  {t("steps.toolkit.resumeBuilder.description1")}
                </p>
                <p className="text-gray-600 mb-1">
                  {t("steps.toolkit.resumeBuilder.description2")}
                </p>
              </div>
            </Card>

            <Card className="flex items-center gap-6 p-6">
              <div className="flex-shrink-0">
                <MessageSquare className="w-8 h-8 text-purple-500" />
              </div>
              <div className="flex-grow text-left">
                <h4 className="text-xl font-semibold text-gray-900 mb-1">
                  {t("steps.toolkit.interviewPrep.title")}
                </h4>
                <p className="text-gray-600 mb-1">
                  {t("steps.toolkit.interviewPrep.description1")}
                </p>
                <p className="text-gray-600">
                  {t("steps.toolkit.interviewPrep.description2")}
                </p>
              </div>
            </Card>

            <Card className="flex items-center gap-6 p-6">
              <div className="flex-shrink-0">
                <Users className="w-8 h-8 text-green-500" />
              </div>
              <div className="flex-grow text-left">
                <h4 className="text-xl font-semibold text-gray-900 mb-1">
                  {t("steps.toolkit.interviewCopilot.title")}
                </h4>
                <p className="text-gray-600">
                  {t("steps.toolkit.interviewCopilot.description1")}
                </p>
                <p className="text-gray-600">
                  {t("steps.toolkit.interviewCopilot.description2")}
                </p>
              </div>
            </Card>
          </div>
        );
      case "testimonials":
        return (
          <div className="grid grid-cols-3 gap-6">
            <Card className="p-6 hover:shadow-md transition-shadow flex flex-col text-left">
              <p className="text-gray-700 text-sm italic mb-4 flex-grow">
                "{t("steps.testimonials.testimonial1.quote")}"
              </p>
              <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold">
                  SM
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {t("steps.testimonials.testimonial1.author")}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t("steps.testimonials.testimonial1.role")}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-md transition-shadow flex flex-col text-left">
              <p className="text-gray-700 text-sm italic mb-4 flex-grow">
                "{t("steps.testimonials.testimonial2.quote")}"
              </p>
              <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold">
                  MT
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {t("steps.testimonials.testimonial2.author")}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t("steps.testimonials.testimonial2.role")}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-md transition-shadow flex flex-col text-left">
              <p className="text-gray-700 text-sm italic mb-4 flex-grow">
                "{t("steps.testimonials.testimonial3.quote")}"
              </p>
              <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-semibold">
                  KF
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {t("steps.testimonials.testimonial3.author")}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t("steps.testimonials.testimonial3.role")}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto text-center"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-4xl mb-4"
            >
              {steps[currentStep].icon}
            </motion.div>
            <h1 className="text-3xl font-bold mb-4 text-gray-900">
              {t(`steps.${steps[currentStep].title}.title`)}
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              {t(`steps.${steps[currentStep].title}.description`)}
            </p>
            <div className="mb-4">
              {renderStepContent(steps[currentStep].title)}
            </div>
            <div className="flex justify-center">
              <Button onClick={handleNext} size="xl">
                {currentStep === steps.length - 1 ? (
                  <>
                    <BookOpen className="w-4 h-4 mr-2" />
                    {t("buttons.startKnowledgeBase")}
                  </>
                ) : (
                  <>
                    {t("buttons.next")}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
