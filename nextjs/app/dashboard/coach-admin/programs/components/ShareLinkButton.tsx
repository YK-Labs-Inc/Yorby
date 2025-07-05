"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Share2, Check } from "lucide-react";
import { useTranslations } from "next-intl";

export function ShareLinkButton({
  coachSlug,
  programId,
}: {
  coachSlug: string;
  programId: string;
}) {
  const [copied, setCopied] = React.useState(false);
  const t = useTranslations("coachAdminPortal.programsPage");

  const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/${coachSlug}/${programId}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
      {copied ? (
        <>
          <Check className="h-4 w-4" />
          {t("shareLinkCopied")}
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4" />
          {t("shareLink")}
        </>
      )}
    </Button>
  );
}
