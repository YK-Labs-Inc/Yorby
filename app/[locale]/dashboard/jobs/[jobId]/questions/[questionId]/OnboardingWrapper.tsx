"use client";

import { useEffect, useState } from "react";
import { CombinedOnboardingDialog } from "./CombinedOnboardingDialog";

interface Props {
  showOnboarding?: boolean;
}

export function OnboardingWrapper({ showOnboarding = false }: Props) {
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    setShowDialog(showOnboarding);
  }, [showOnboarding]);

  return (
    <CombinedOnboardingDialog open={showDialog} onOpenChange={setShowDialog} />
  );
}
