"use client";

import { LandingHero } from "@/app/components/landing/LandingHero";
import OurFeatures from "@/app/components/landing/OurFeatures";
import DemoFeatures from "@/app/components/landing/DemoFeatures";
import Footer from "@/app/components/landing/Footer";
import { BottomCTA } from "@/app/components/landing/BottomCTA";

export default function LandingPageV5(props: {
  user: any;
  hasSubscription: boolean;
  credits: number;
  isSubscriptionVariant: boolean;
  isFreemiumEnabled: boolean;
  transformResumeEnabled: boolean;
}) {
  return (
    <div className="min-h-screen bg-background">
      <LandingHero />
      <DemoFeatures {...props} />
      <OurFeatures />
      <BottomCTA />
      <Footer />
    </div>
  );
}
