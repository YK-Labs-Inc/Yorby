"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Check,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

const TOTAL_STEPS = 5;

const STEPS = [
  "problem",
  "solution",
  "howItWorks",
  "benefits",
  "comparison",
] as const;

export default function OnboardingFlow() {
  const t = useTranslations("onboarding.recruitingOnboarding");
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize currentStep from search param if it exists
  const getInitialStep = () => {
    const stepParam = searchParams.get("step");
    if (stepParam) {
      const stepIndex = STEPS.indexOf(stepParam as (typeof STEPS)[number]);
      if (stepIndex !== -1) {
        return stepIndex;
      }
    }
    return 0;
  };

  const [currentStep, setCurrentStep] = useState(getInitialStep);

  const currentStepKey = STEPS[currentStep];

  // Update URL when step changes
  useEffect(() => {
    const currentStepParam = searchParams.get("step");
    const expectedStep = STEPS[currentStep];

    // Only update URL if the step parameter is different from the current step
    if (currentStepParam !== expectedStep) {
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.set("step", expectedStep);
      router.replace(`/recruiting-onboarding?${newSearchParams.toString()}`, {
        scroll: false,
      });
    }
  }, [currentStep, router, searchParams]);

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (currentStep === TOTAL_STEPS - 1) {
      // Navigate to recruiting page after the last step (comparison)
      router.push("/recruiting");
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSkip = () => {
    router.push("/recruiting");
  };

  const progressPercentage = ((currentStep + 1) / TOTAL_STEPS) * 100;

  const renderStepContent = () => {
    switch (currentStepKey) {
      case "problem":
        return (
          <div className="space-y-12 max-w-5xl mx-auto">
            {/* Hero Section with better visual hierarchy */}
            <div className="text-center space-y-6">
              <div className="space-y-4">
                <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent leading-tight">
                  {t("steps.problem.headline")}
                </h1>
                <p className="text-xl md:text-2xl text-gray-600 font-light max-w-2xl mx-auto">
                  {t("steps.problem.subheadline")}
                </p>
              </div>
            </div>

            {/* Stats with improved visual design */}
            <div className="grid md:grid-cols-3 gap-8">
              {["applicantsPerRole", "screeningTime", "missedTalent"].map(
                (stat, index) => (
                  <motion.div
                    key={stat}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity" />
                    <div className="relative bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all duration-300">
                      <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
                        {t(`steps.problem.stats.${stat}.number`)}
                      </div>
                      <div className="text-gray-600 font-medium">
                        {t(`steps.problem.stats.${stat}.label`)}
                      </div>
                    </div>
                  </motion.div>
                )
              )}
            </div>

            {/* Pain Points with cleaner design */}
            <div className="space-y-8">
              <h2 className="text-3xl font-bold text-center text-gray-900">
                {t("steps.problem.title")}
              </h2>
              <div className="space-y-4">
                {[1, 2, 3].map((num, index) => (
                  <motion.div
                    key={num}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group"
                  >
                    <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-6 border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-md">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-red-500 mt-2" />
                        <div className="flex-grow">
                          <h3 className="font-semibold text-lg text-gray-900 mb-2">
                            {t(`steps.problem.painPoints.point${num}.title`)}
                          </h3>
                          <p className="text-gray-600 leading-relaxed">
                            {t(
                              `steps.problem.painPoints.point${num}.description`
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        );

      case "solution":
        return (
          <div className="space-y-12 max-w-5xl mx-auto">
            {/* Hero Section */}
            <div className="text-center space-y-6">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent leading-tight">
                  {t("steps.solution.title")}
                </h1>
                <p className="text-xl md:text-2xl text-gray-600 font-light max-w-2xl mx-auto">
                  {t("steps.solution.subtitle")}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="pt-8"
              >
                <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {t("steps.solution.headline")}
                </h2>
                <p className="text-lg md:text-xl text-gray-600 mt-3 max-w-xl mx-auto">
                  {t("steps.solution.subheadline")}
                </p>
              </motion.div>
            </div>

            {/* Feature Cards with modern design */}
            <div className="grid md:grid-cols-3 gap-8">
              {[1, 2, 3].map((num, index) => (
                <motion.div
                  key={num}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="group"
                >
                  <div className="h-full bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-100">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl mb-6 flex items-center justify-center">
                      <span className="text-white font-bold text-xl">
                        {num}
                      </span>
                    </div>
                    <h3 className="font-semibold text-xl mb-3 text-gray-900">
                      {t(`steps.solution.features.feature${num}.title`)}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {t(`steps.solution.features.feature${num}.description`)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Proof Point with gradient background */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-2xl opacity-10 group-hover:opacity-20 transition-opacity" />
                <div className="relative bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-100">
                  <p className="text-lg md:text-xl text-center font-medium text-gray-900">
                    {t("steps.solution.proofPoint")}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        );

      case "howItWorks":
        return (
          <div className="space-y-12 max-w-5xl mx-auto">
            {/* Hero Section */}
            <div className="text-center space-y-6">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent leading-tight">
                  {t("steps.howItWorks.title")}
                </h1>
                <p className="text-xl md:text-2xl text-gray-600 font-light max-w-2xl mx-auto">
                  {t("steps.howItWorks.subtitle")}
                </p>
              </motion.div>
            </div>

            {/* Process Steps with timeline design */}
            <div className="relative">
              {/* Connecting line */}
              <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gradient-to-b from-blue-200 via-purple-200 to-blue-200 hidden md:block" />

              <div className="space-y-8">
                {[1, 2, 3].map((num, index) => (
                  <motion.div
                    key={num}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.2 }}
                    className="flex gap-6 items-start"
                  >
                    <div className="flex-shrink-0 relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white flex items-center justify-center text-xl font-bold shadow-lg shadow-blue-600/20">
                        {t(`steps.howItWorks.step${num}.number`)}
                      </div>
                    </div>
                    <div className="flex-grow group">
                      <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-100">
                        <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                          {t(`steps.howItWorks.step${num}.title`)}
                        </h3>
                        <p className="text-gray-600 leading-relaxed mb-3 text-lg">
                          {t(`steps.howItWorks.step${num}.description`)}
                        </p>
                        <p className="text-base bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-medium">
                          {t(`steps.howItWorks.step${num}.detail`)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        );

      case "benefits":
        return (
          <div className="space-y-12 max-w-5xl mx-auto">
            {/* Hero Section */}
            <div className="text-center space-y-6">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent leading-tight">
                  {t("steps.benefits.title")}
                </h1>
                <p className="text-xl md:text-2xl text-gray-600 font-light max-w-2xl mx-auto">
                  {t("steps.benefits.subtitle")}
                </p>
              </motion.div>
            </div>

            {/* Metrics with gradient design */}
            <div className="grid md:grid-cols-3 gap-8">
              {[1, 2, 3].map((num, index) => (
                <motion.div
                  key={num}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="group"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity" />
                    <div className="relative bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 text-center">
                      <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">
                        {t(`steps.benefits.metrics.metric${num}.value`)}
                      </div>
                      <div className="text-xl font-semibold text-gray-900 mb-2">
                        {t(`steps.benefits.metrics.metric${num}.label`)}
                      </div>
                      <div className="text-gray-600">
                        {t(`steps.benefits.metrics.metric${num}.description`)}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );

      case "comparison":
        return (
          <div className="space-y-12 max-w-5xl mx-auto">
            {/* Hero Section */}
            <div className="text-center space-y-6">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent leading-tight">
                  {t("steps.comparison.title")}
                </h1>
                <p className="text-xl md:text-2xl text-gray-600 font-light max-w-2xl mx-auto">
                  {t("steps.comparison.subtitle")}
                </p>
              </motion.div>
            </div>

            {/* Comparison Cards */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Traditional Method Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl blur-2xl opacity-10 group-hover:opacity-20 transition-opacity" />
                <div className="relative bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-red-100">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-6">
                    {t("steps.comparison.traditional.title")}
                  </h3>
                  <ul className="space-y-4">
                    {[1, 2, 3, 4, 5, 6].map((num, index) => (
                      <motion.li
                        key={num}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.05 }}
                        className="flex items-start gap-3"
                      >
                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-red-500 mt-2" />
                        <span className="text-gray-600 leading-relaxed">
                          {t(`steps.comparison.traditional.points.point${num}`)}
                        </span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </motion.div>

              {/* Yorby Method Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-2xl opacity-10 group-hover:opacity-20 transition-opacity" />
                <div className="relative bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-blue-100">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-6">
                    {t("steps.comparison.yorby.title")}
                  </h3>
                  <ul className="space-y-4">
                    {[1, 2, 3, 4, 5, 6].map((num, index) => (
                      <motion.li
                        key={num}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.05 }}
                        className="flex items-start gap-3"
                      >
                        <div className="flex-shrink-0">
                          <svg
                            className="w-5 h-5 text-green-500 mt-0.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                        <span className="text-gray-600 leading-relaxed">
                          {t(`steps.comparison.yorby.points.point${num}`)}
                        </span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            </div>

            {/* Bottom Line with gradient background */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-2xl opacity-10 group-hover:opacity-20 transition-opacity" />
                <div className="relative bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-100">
                  <p className="text-lg md:text-xl text-center font-medium text-gray-900">
                    {t("steps.comparison.bottomLine")}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        );


      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50/50 to-white">
      <div className="container mx-auto px-4 py-6 md:py-12">
        {/* Simplified Navigation Bar */}
        <div className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-6">
            {/* Logo placeholder */}
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-blue-600" />
              <span className="font-semibold text-gray-900">
                {t("branding.title")}
              </span>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <Progress value={progressPercentage} className="w-24 h-1.5" />
              <span className="text-sm text-gray-500">
                {t("navigation.step", {
                  current: currentStep + 1,
                  total: TOTAL_STEPS,
                })}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="text-gray-500 hover:text-gray-700"
          >
            {t("navigation.skipTour")}
          </Button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>

        {/* Improved Navigation with better visual hierarchy */}
        <div className="flex justify-between items-center mt-16">
          {currentStep > 0 ? (
            <Button
              variant="ghost"
              onClick={handlePrevious}
              className="text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />{" "}
              {t("navigation.previous")}
            </Button>
          ) : (
            <div />
          )}

          {currentStep <= TOTAL_STEPS - 1 && (
            <Button
              onClick={handleNext}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-6 text-base font-medium shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30 transition-all duration-300"
            >
              {currentStep === TOTAL_STEPS - 1 
                ? t("navigation.getStarted") 
                : t(`steps.${currentStepKey}.cta`)}
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
