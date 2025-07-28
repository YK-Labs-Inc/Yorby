"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";

interface ShareButtonProps {
  url: string;
  titleOverride?: string;
}

export function ShareButton({ url, titleOverride }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const t = useTranslations("common");
  const { logError } = useAxiomLogging();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      logError("Failed to copy to clipboard", {
        error: error instanceof Error ? error.message : String(error),
        url,
      });
    }
  };

  return (
    <Button onClick={handleCopy} className="gap-2">
      {copied ? (
        <>
          <Check className="h-4 w-4" />
          {t("share.copied")}
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4" />
          {titleOverride || t("share.button")}
        </>
      )}
    </Button>
  );
}
