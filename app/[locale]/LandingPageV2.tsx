"use client";

import JobCreationComponent from "./JobCreationComponent";
import { useTranslations } from "next-intl";
import FeatureHighlight from "./components/FeatureHighlight";
import Typewriter from "@/components/typewriter/react";
import FAQ from "./components/FAQ";
import { useFeatureFlagEnabled } from "posthog-js/react";

export default function LandingPageV2() {
  const isInterviewCopilotEnabled = useFeatureFlagEnabled(
    "enable-interview-copilot"
  );
  const t = useTranslations("landingPage");
  return (
    <div className="flex flex-col justify-center min-h-screen w-full mt-8 p-4">
      <FeatureHighlight />
      <div className="relative w-full border-2 border-gray-300 rounded-lg p-4 shadow-lg">
        <JobCreationComponent />
      </div>
      <FAQ />
    </div>
  );
}
