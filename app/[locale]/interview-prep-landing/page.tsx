import React from "react";
import { HeroSection } from "./components/HeroSection";
import { FeaturesSection } from "./components/FeaturesSection";
import { HowItWorks } from "./components/HowItWorks";
import { CTASection } from "./components/CTASection";

export default function InterviewPrepLandingPage() {
  return (
    <main className="w-full min-h-screen">
      <HeroSection />
      <FeaturesSection />
      <HowItWorks />
      <CTASection />
    </main>
  );
}
