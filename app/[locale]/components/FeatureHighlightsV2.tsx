"use client";

import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { useFeatureFlagEnabled } from "posthog-js/react";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  CheckCircle2,
  Timer,
  Brain,
  Target,
  Rocket,
  Sparkles,
  CreditCard,
  Lock,
  Calendar,
  MessageSquare,
  Clock,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "@/i18n/routing";
import JobCreationComponent from "../JobCreationComponent";
import { InterviewCopilotCreationForm } from "../dashboard/interview-copilots/InterviewCopilotCreationForm";

interface FeatureProps {
  id: keyof typeof FEATURE_IDS;
  icon: React.ReactNode;
  img: string;
  category: "prep" | "dayOf" | "other";
}

const FEATURE_IDS = {
  resumeBuilder: "resumeBuilder",
  practiceQuestions: "practiceQuestions",
  feedback: "feedback",
  aiAnswers: "aiAnswers",
  mockInterviews: "mockInterviews",
  performance: "performance",
  interviewCopilot: "interviewCopilot",
  pricing: "pricing",
} as const;

const features: FeatureProps[] = [
  {
    id: "practiceQuestions",
    icon: <Target className="w-8 h-8" />,
    img: "/assets/unlimited-practice-questions.png",
    category: "prep",
  },
  {
    id: "aiAnswers",
    icon: <Sparkles className="w-8 h-8" />,
    img: "/assets/generate-answers.png",
    category: "prep",
  },
  {
    id: "mockInterviews",
    icon: <Timer className="w-8 h-8" />,
    img: "/assets/mock-interview-demo.png",
    category: "prep",
  },
  {
    id: "performance",
    icon: <CheckCircle2 className="w-8 h-8" />,
    img: "/assets/interview-feedback.png",
    category: "prep",
  },
  {
    id: "interviewCopilot",
    icon: <Rocket className="w-8 h-8" />,
    img: "/assets/interview-copilot-demo.png",
    category: "dayOf",
  },
];

// Animation variants
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

// Testimonials data
const testimonials = [
  {
    name: "Sarah Chen",
    role: "Product Manager at Google",
    company: "Google",
    quote:
      "The Interview Copilot gave me the confidence I needed to tackle tough questions and land my dream job.",
    image: "/assets/testimonials/sarah.jpg",
  },
  {
    name: "James Rodriguez",
    role: "Software Engineer at Meta",
    company: "Meta",
    quote:
      "Being able to prepare with AI feedback and then use the copilot during the actual interview was a game changer.",
    image: "/assets/testimonials/james.jpg",
  },
  {
    name: "Priya Patel",
    role: "Data Scientist at Amazon",
    company: "Amazon",
    quote:
      "Perfect Interview helped me transition into tech. The real-time assistance during interviews made all the difference.",
    image: "/assets/testimonials/priya.jpg",
  },
];

// Companies data
const companies = [
  "Google",
  "Meta",
  "Amazon",
  "Apple",
  "Microsoft",
  "Netflix",
  "Uber",
  "Airbnb",
];

export default function FeatureHighlight() {
  const t = useTranslations("FeatureHighlightsV2");

  return (
    <div className="w-full bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
      {/* Hero Section */}
      <div className="w-full max-w-[1200px] mx-auto px-1 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1 bg-primary/20 rounded-full text-primary text-sm font-semibold mb-4">
            {t("hero.badge")}
          </span>
          <h2 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">
            {t("hero.title")}
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
            {t("hero.description")}
          </p>
          <div className="flex justify-center gap-4 flex-col sm:flex-row">
            <Link href="/sign-in">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-lg px-8"
              >
                {t("hero.getStarted")}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Journey Feature Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-24"
        >
          <div className="relative">
            {/* Connection Line */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20 transform -translate-y-1/2 hidden md:block" />

            {/* Journey Steps */}
            <div className="grid md:grid-cols-2 gap-8 md:gap-16 relative">
              {/* Before Interviews */}
              <div className="relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-xl" />
                <div className="relative bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl border border-gray-200 dark:border-gray-700 h-full">
                  <h3 className="text-2xl font-bold mb-8 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                      1
                    </span>
                    {t("journey.before.title")}
                  </h3>
                  <div className="space-y-8">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <MessageSquare className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg mb-2">
                          {t("journey.before.resumeBuilder.title")}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-300">
                          {t("journey.before.resumeBuilder.description")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Target className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg mb-2">
                          {t("journey.before.practiceQuestions.title")}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-300">
                          {t("journey.before.practiceQuestions.description")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* During Interviews */}
              <div className="relative">
                <div className="absolute top-0 left-0 w-24 h-24 bg-primary/5 rounded-full blur-xl" />
                <div className="relative bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl border border-gray-200 dark:border-gray-700 h-full flex flex-col">
                  <h3 className="text-2xl font-bold mb-8 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                      2
                    </span>
                    {t("journey.during.title")}
                  </h3>
                  <div className="flex-grow flex items-center justify-center">
                    <div className="text-center max-w-sm">
                      <div className="flex justify-center mb-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Rocket className="w-6 h-6 text-primary" />
                        </div>
                      </div>
                      <h4 className="font-semibold text-lg mb-2">
                        {t("journey.during.interviewCopilot.title")}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300 mb-4">
                        {t("journey.during.interviewCopilot.description")}
                      </p>
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                        {t("journey.during.interviewCopilot.badge")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Feature Journey Section */}
        <div className="mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h3 className="text-4xl font-bold mb-4">{t("features.title")}</h3>
          </motion.div>

          {/* Resume Builder Section */}
          <div className="mb-20 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-primary/10 rounded-3xl" />
            <div className="relative p-12">
              <div className="text-center mb-12">
                <h4 className="text-2xl font-bold mb-4 inline-block px-6 py-2 bg-primary/10 rounded-full text-primary">
                  {t("features.resumeBuilder.title")}
                </h4>
                <p className="text-lg text-gray-600 dark:text-gray-300 mt-4">
                  {t("features.resumeBuilder.description")}
                </p>
              </div>

              {/* Video Demo Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative mb-12"
              >
                <div className="relative rounded-2xl overflow-hidden shadow-2xl max-w-[1000px] mx-auto">
                  <video
                    src="/assets/resume-builder-demo.mp4"
                    className="w-full aspect-video"
                    autoPlay
                    loop
                    muted
                    playsInline
                    controls
                  />
                </div>
              </motion.div>

              {/* Features Grid */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-[1000px] mx-auto"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold mb-2">
                        {t(
                          "features.resumeBuilder.features.conversation.title"
                        )}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300">
                        {t(
                          "features.resumeBuilder.features.conversation.description"
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold mb-2">
                        {t("features.resumeBuilder.features.formatting.title")}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300">
                        {t(
                          "features.resumeBuilder.features.formatting.description"
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold mb-2">
                        {t("features.resumeBuilder.features.time.title")}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300">
                        {t("features.resumeBuilder.features.time.description")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center mt-12">
                  <Link href="/resume-builder-demo">
                    <Button
                      size="lg"
                      className="bg-primary hover:bg-primary/90 text-lg px-12"
                    >
                      {t("features.resumeBuilder.tryButton")}{" "}
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
          {/* Interview Prep Section */}
          <div className="mb-20 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-primary/10 rounded-3xl" />
            <div className="relative p-12">
              <div className="text-center mb-12">
                <h4 className="text-2xl font-bold mb-4 inline-block px-6 py-2 bg-primary/10 rounded-full text-primary">
                  {t("features.prep.title")}
                </h4>
                <p className="text-lg text-gray-600 dark:text-gray-300 mt-4">
                  {t("features.prep.description")}
                </p>
              </div>

              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="flex flex-row justify-center gap-4 flex-wrap"
              >
                {features
                  .filter((f) => f.category === "prep")
                  .map((feature) => (
                    <motion.div
                      key={feature.id}
                      variants={item}
                      className="w-full md:w-[49%]"
                    >
                      <Card className="flex flex-col justify-between group h-full overflow-hidden bg-white dark:bg-gray-800 rounded-3xl border dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                        <div className="p-8">
                          <div className="mb-6 text-primary">
                            {feature.icon}
                          </div>
                          <h4 className="text-xl font-bold mb-4 dark:text-white group-hover:text-primary transition-colors">
                            {t(`features.${feature.id}.title`)}
                          </h4>
                          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                            {t(`features.${feature.id}.description`)}
                          </p>
                        </div>
                        <div className="relative bg-gray-50 dark:bg-gray-900 p-4">
                          <img
                            src={feature.img}
                            alt={t(`features.${feature.id}.title`)}
                            className="w-full h-full object-cover rounded-lg shadow-md transform group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      </Card>
                    </motion.div>
                  ))}
              </motion.div>
            </div>
          </div>

          <div className="overflow-y-scroll h-[500px] relative w-full border-2 border-gray-300 rounded-lg p-4 shadow-lg mb-4">
            <JobCreationComponent />
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5 rounded-3xl" />
            <div className="relative p-12">
              <div className="text-center mb-12">
                <h4 className="text-2xl font-bold mb-4 inline-block px-6 py-2 bg-primary/10 rounded-full text-primary">
                  {t("features.copilot.title")}
                </h4>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  {t("features.copilot.description")}
                </p>
                <p className="text-lg text-gray-600 dark:text-gray-300 mt-4">
                  {t("features.copilot.note")}
                </p>
              </div>

              {/* Image Section - Now comes first and is full width */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative mb-12"
              >
                <div className="relative rounded-2xl overflow-hidden shadow-2xl max-w-[1000px] mx-auto">
                  <video
                    src="/assets/interview-copilot-demo.mp4"
                    className="w-full"
                    autoPlay
                    loop
                    muted
                    playsInline
                    controls
                  />
                </div>
              </motion.div>

              {/* Features Section - Now in a three column layout */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-[1000px] mx-auto"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <Brain className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold mb-2">
                        {t("features.copilot.features.aiGuidance.title")}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300">
                        {t("features.copilot.features.aiGuidance.description")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <Timer className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold mb-2">
                        {t("features.copilot.features.timing.title")}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300">
                        {t("features.copilot.features.timing.description")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold mb-2">
                        {t("features.copilot.features.personalization.title")}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300">
                        {t(
                          "features.copilot.features.personalization.description"
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center mt-12">
                  <Link href="/interview-copilot-demo">
                    <Button
                      size="lg"
                      className="bg-primary hover:bg-primary/90 text-lg px-12"
                    >
                      {t("features.copilot.tryButton")}{" "}
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
          <div className="mt-8 overflow-y-scroll h-[500px] relative w-full border-2 border-gray-300 rounded-lg p-4 shadow-lg mb-4">
            <InterviewCopilotCreationForm />
          </div>
        </div>

        {/* Pricing Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-24 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-primary/10 rounded-3xl" />
          <div className="relative p-12">
            <div className="text-center mb-8">
              <span className="inline-block px-4 py-1 bg-primary/20 rounded-full text-primary text-sm font-semibold mb-4">
                {t("pricing.badge")}
              </span>
              <h3 className="text-5xl font-bold mb-6">
                {t("pricing.titleV2") || "Simple Transparent Pricing"}
              </h3>

              <div className="flex justify-center">
                <Link href="/purchase">
                  <Button
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-lg px-12"
                  >
                    {t("pricing.viewPlansButton")}{" "}
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Final CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center bg-primary/5 rounded-3xl p-12"
        >
          <h3 className="text-4xl font-bold mb-6">{t("finalCTA.title")}</h3>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            {t("finalCTA.description")}
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Link href="/sign-in">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-lg px-8"
              >
                {t("finalCTA.button")} <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-500">{t("finalCTA.footer")}</p>
        </motion.div>
      </div>
    </div>
  );
}
