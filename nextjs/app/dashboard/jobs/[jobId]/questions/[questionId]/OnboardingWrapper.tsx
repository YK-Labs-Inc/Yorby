"use client";

import { useEffect, useState } from "react";
import { CombinedOnboardingDialog } from "./CombinedOnboardingDialog";
import { markQuestionAnswerOnboardingViewed } from "./actions";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";

interface Props {
  showOnboarding?: boolean;
}

export function OnboardingWrapper({ showOnboarding = false }: Props) {
  const [showDialog, setShowDialog] = useState(false);
  const { logError } = useAxiomLogging();

  useEffect(() => {
    setShowDialog(showOnboarding);
  }, [showOnboarding]);

  const handleOpenChange = async (open: boolean) => {
    setShowDialog(open);

    // If the dialog is being closed (open = false), mark onboarding as viewed
    if (!open && showOnboarding) {
      try {
        await markQuestionAnswerOnboardingViewed();
      } catch (error) {
        logError("Failed to mark onboarding as viewed:", { error });
      }
    }
  };

  return (
    <CombinedOnboardingDialog
      open={showDialog}
      onOpenChange={handleOpenChange}
    />
  );
}
