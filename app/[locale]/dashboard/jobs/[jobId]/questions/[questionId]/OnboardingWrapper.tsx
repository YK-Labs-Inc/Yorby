"use client";

import { useEffect, useState } from "react";
import { OnboardingDialog } from "./OnboardingDialog";
import { GenerateAnswerOnboardingDialog } from "./GenerateAnswerOnboardingDialog";

interface Props {
  showAnswerOnboarding?: boolean;
  showGenerateOnboarding?: boolean;
}

export function OnboardingWrapper({
  showAnswerOnboarding = false,
  showGenerateOnboarding = false,
}: Props) {
  const [showAnswerDialog, setShowAnswerDialog] =
    useState(showAnswerOnboarding);
  const [showGenerateDialog, setShowGenerateDialog] = useState(
    showGenerateOnboarding
  );
  useEffect(() => {
    setShowAnswerDialog(showAnswerOnboarding);
    setShowGenerateDialog(showGenerateOnboarding);
  }, [showAnswerOnboarding, showGenerateOnboarding]);

  return (
    <>
      <OnboardingDialog
        open={showAnswerDialog}
        onOpenChange={setShowAnswerDialog}
      />
      <GenerateAnswerOnboardingDialog
        open={showGenerateDialog}
        onOpenChange={setShowGenerateDialog}
      />
    </>
  );
}
