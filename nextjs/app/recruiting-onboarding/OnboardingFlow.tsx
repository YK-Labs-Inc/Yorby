"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { markOnboardingComplete } from "./actions";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";

const TOTAL_STEPS = 3;

const STEPS = ["freeATS", "howItWorks", "comparison"] as const;

export default function OnboardingFlow() {
  const t = useTranslations("onboarding.recruitingOnboarding");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { logError } = useAxiomLogging();

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
  const [isLoading, setIsLoading] = useState(false);

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

  const handleNext = async () => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (currentStep === TOTAL_STEPS - 1) {
      // Mark onboarding as complete and navigate to recruiting page
      setIsLoading(true);
      try {
        await markOnboardingComplete();
      } catch (error) {
        logError("Error completing onboarding:", { error });
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const renderStepContent = () => {
    switch (currentStepKey) {
      case "freeATS":
        return (
          <div className="space-y-12 max-w-5xl mx-auto">
            {/* Hero Section */}
            <div className="text-center space-y-6">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
                  {t("steps.freeATS.title")}
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  {t("steps.freeATS.subtitle")}
                </p>
              </motion.div>

              {/* GitHub Link */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <motion.a
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  href="https://github.com/YK-Labs-LLC/Yorby"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors text-sm font-medium"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  <span>{t("steps.freeATS.github.title")}</span>
                </motion.a>
              </div>
            </div>

            {/* Core Benefits */}
            <div className="grid md:grid-cols-3 gap-8">
              {[1, 2, 3].map((num, index) => (
                <motion.div
                  key={num}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="group"
                >
                  <div className="h-full bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-blue-100">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg mb-4 flex items-center justify-center">
                      {num === 1 && (
                        <svg
                          className="w-6 h-6 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 6h16M4 12h16M4 18h16"
                          />
                        </svg>
                      )}
                      {num === 2 && (
                        <svg
                          className="w-6 h-6 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                          />
                        </svg>
                      )}
                      {num === 3 && (
                        <svg
                          className="w-6 h-6 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      )}
                    </div>
                    <h3 className="font-semibold text-lg mb-2 text-gray-900">
                      {t(`steps.freeATS.benefits.benefit${num}.title`)}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {t(`steps.freeATS.benefits.benefit${num}.description`)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* What's the Catch? */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-gray-50 rounded-xl p-6 border border-gray-200 max-w-2xl mx-auto"
            >
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center justify-center gap-2">
                  <span>🤔</span>
                  {t("steps.freeATS.whatsTheCatch.title")}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {t("steps.freeATS.whatsTheCatch.description")}
                </p>
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
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
                  {t("steps.howItWorks.title")}
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  {t("steps.howItWorks.subtitle")}
                </p>
              </motion.div>
            </div>

            {/* 3-Step Process */}
            <div className="grid md:grid-cols-3 gap-8">
              {[1, 2, 3].map((num, index) => (
                <motion.div
                  key={num}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                    {num}
                  </div>
                  <h3 className="font-semibold text-lg mb-2 text-gray-900">
                    {t(`steps.howItWorks.process.step${num}.title`)}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {t(`steps.howItWorks.process.step${num}.description`)}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* AI Enhancement Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-100"
            >
              <div className="text-center">
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                  {t("steps.howItWorks.aiEnhancement.title")}
                </h3>
                <p className="text-lg text-gray-700 font-medium">
                  {t("steps.howItWorks.aiEnhancement.subtitle")}
                </p>
                <p className="text-gray-600 mt-2">
                  {t("steps.howItWorks.aiEnhancement.description")}
                </p>
              </div>
            </motion.div>
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
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
                  {t("steps.comparison.title")}
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  {t("steps.comparison.subtitle")}
                </p>
              </motion.div>
            </div>

            {/* Comparison Cards */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Traditional ATS Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gray-50 rounded-xl p-6 border border-gray-200"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-red-500">✕</span>
                  {t("steps.comparison.traditional.title")}
                </h3>
                <ul className="space-y-3">
                  {[1, 2, 3, 4].map((num) => (
                    <li key={num} className="text-gray-600 text-sm">
                      {t(`steps.comparison.traditional.points.point${num}`)}
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Yorby Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-blue-50 rounded-xl p-6 border border-blue-200"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  {t("steps.comparison.yorby.title")}
                </h3>
                <ul className="space-y-3">
                  {[1, 2, 3, 4].map((num) => (
                    <li key={num} className="text-gray-600 text-sm">
                      {t(`steps.comparison.yorby.points.point${num}`)}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>

            {/* AI Recruiter Pricing Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-200"
            >
              {/* Header */}
              <div className="text-center mb-8">
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                  {t("steps.comparison.pricingCard.title")}
                </h3>
                <p className="text-blue-600 font-medium text-lg">
                  {t("steps.comparison.pricingCard.subtitle")}
                </p>
              </div>

              {/* Pricing and Features Grid */}
              <div className="grid md:grid-cols-2 gap-8 items-start">
                {/* Left: Pricing */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="text-center">
                    <div className="flex items-baseline justify-center gap-1 mb-3">
                      <span className="text-5xl font-bold text-gray-900">
                        {t("steps.comparison.pricingCard.price")}
                      </span>
                      <span className="text-xl text-gray-600">
                        {t("steps.comparison.pricingCard.period")}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-2 font-medium">
                      {t("steps.comparison.pricingCard.includedInterviews")}
                    </p>
                    <p className="text-sm text-gray-500">
                      {t("steps.comparison.pricingCard.overagePrice")}
                    </p>
                  </div>
                </div>

                {/* Right: Features */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h4 className="font-semibold text-gray-900 mb-4 text-center">
                    {t("steps.comparison.pricingCard.featuresTitle")}
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <div key={num} className="flex items-center gap-3">
                        <svg
                          className="w-4 h-4 text-green-500 flex-shrink-0"
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
                        <span className="text-sm text-gray-700">
                          {t(
                            `steps.comparison.pricingCard.features.feature${num}`
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Note */}
              <div className="text-center mt-6">
                <p className="text-sm text-gray-600">
                  {t("steps.comparison.pricingCard.availabilityNote")}
                </p>
              </div>
            </motion.div>

            {/* Value Props */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex justify-center gap-6 text-sm text-gray-600"
            >
              {[1, 2, 3].map((num) => (
                <div key={num} className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-green-500"
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
                  <span>{t(`steps.comparison.valueProps.prop${num}`)}</span>
                </div>
              ))}
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
          </div>

          {/* Step indicators (dots) */}
          <div className="flex items-center gap-2">
            {[...Array(TOTAL_STEPS)].map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep
                    ? "bg-blue-600"
                    : index < currentStep
                      ? "bg-blue-300"
                      : "bg-gray-300"
                }`}
              />
            ))}
          </div>
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
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-6 text-base font-medium shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30 transition-all duration-300"
            >
              {isLoading ? (
                t("navigation.loading")
              ) : (
                <>
                  {currentStep === TOTAL_STEPS - 1
                    ? t("navigation.getStarted")
                    : t(`steps.${currentStepKey}.cta`)}
                  <ChevronRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
