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
      <div className="w-full max-w-[1080px] mx-auto px-4 py-16 flex items-center justify-center">
        <div className="w-full h-96 md:h-[600px] overflow-hidden rounded-lg shadow-lg bg-muted flex items-center justify-center border border-border">
          <video
            className="w-full h-full object-contain"
            src="/assets/interview-prep-demo.mp4"
            autoPlay
            muted
            playsInline
            controls
          />
        </div>
      </div>
      <CTASection />
    </main>
  );
}
