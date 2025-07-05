"use client";

import { useState } from "react";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslations } from "next-intl";
import { markMockInterviewOnboardingViewed } from "./questions/[questionId]/actions";

interface MockInterviewOnboardingProps {
  hasViewedOnboarding: boolean;
}

export default function MockInterviewOnboarding({
  hasViewedOnboarding,
}: MockInterviewOnboardingProps) {
  const [showOnboarding, setShowOnboarding] = useState(!hasViewedOnboarding);
  const t = useTranslations("mockInterview");

  const handleCloseOnboarding = async () => {
    setShowOnboarding(false);
    // Mark onboarding as viewed in the database
    await markMockInterviewOnboardingViewed();
  };

  // Don't render if user has already viewed onboarding
  if (hasViewedOnboarding) {
    return null;
  }

  return (
    <Dialog
      open={showOnboarding}
      onOpenChange={(open) => !open && handleCloseOnboarding()}
    >
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {t("onboarding.title")}
          </DialogTitle>
          <DialogDescription className="text-lg pt-2">
            {t("onboarding.description")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {[1, 2, 3].map((stepNum) => (
            <div key={stepNum} className="flex gap-4 items-start">
              <div className="mt-1">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-lg">
                  {t(`onboarding.steps.${stepNum}.title`)}
                </h3>
                <p className="text-muted-foreground">
                  {t(`onboarding.steps.${stepNum}.description`)}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <Button onClick={handleCloseOnboarding}>
            {t("onboarding.button")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
