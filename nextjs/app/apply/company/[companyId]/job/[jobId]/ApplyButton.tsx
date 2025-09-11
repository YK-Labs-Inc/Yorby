"use client";

import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { usePostHog } from "posthog-js/react";

interface ApplyButtonProps {
  companyId: string;
  jobId: string;
}

export default function ApplyButton({ companyId, jobId }: ApplyButtonProps) {
  const t = useTranslations("apply");
  const posthog = usePostHog();
  const router = useRouter();

  const handleApplyClick = () => {
    // Track the event first
    posthog.capture("apply_button_clicked", {
      jobId,
      companyId,
    });
    
    // Then navigate
    router.push(`/apply/company/${companyId}/job/${jobId}/application`);
  };

  return (
    <Button 
      type="button" 
      size="lg" 
      className="w-full" 
      onClick={handleApplyClick}
    >
      {t("jobPage.buttons.applyNow")}
    </Button>
  );
}
