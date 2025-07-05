"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

interface JoinProgramButtonProps {
  coachName: string;
  redirectTo: string;
  isEnrolled?: boolean;
}

export default function JoinProgramButton({
  coachName,
  redirectTo,
  isEnrolled = false,
}: JoinProgramButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const t = useTranslations("coachPortal");

  const handleClick = () => {
    setIsLoading(true);
    router.push(redirectTo);
  };

  if (isEnrolled) {
    return (
      <Button onClick={handleClick} disabled={isLoading} className="w-full sm:w-auto">
        {isLoading ? t("joiningButton") : t("continueToProgram")}
      </Button>
    );
  }

  return (
    <Button onClick={handleClick} disabled={isLoading} className="w-full sm:w-auto">
      {isLoading ? t("joiningButton") : t("joinButton", { coachName })}
    </Button>
  );
}