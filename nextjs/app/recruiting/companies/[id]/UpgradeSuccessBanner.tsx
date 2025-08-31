"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { CheckCircle, X } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { checkCompanySubscription } from "./actions";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";

interface UpgradeSuccessBannerProps {
  companyId: string;
}

export function UpgradeSuccessBanner({ companyId }: UpgradeSuccessBannerProps) {
  const t = useTranslations("apply.upgradeSuccessBanner");
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [isChecking, setIsChecking] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { logError } = useAxiomLogging();

  useEffect(() => {
    const upgraded = searchParams.get("upgraded");

    if (upgraded === "true") {
      setIsChecking(true);
      checkSubscriptionStatus();
    }
  }, [searchParams]);

  const checkSubscriptionStatus = async () => {
    try {
      setShowBanner(true);
      const result = await checkCompanySubscription(companyId);

      if (!result.success || !result.hasSubscription) {
        // If not found and we haven't exceeded retry limit, retry after 5 seconds
        if (retryCount < 3) {
          setTimeout(() => {
            setRetryCount((prev) => prev + 1);
            checkSubscriptionStatus();
          }, 5000);
        } else {
          // Max retries reached
          setError(t("error.message"));
          setIsChecking(false);
        }
      } else {
        // Subscription found!
        setIsChecking(false);
        setShowBanner(true);

        // Remove the upgraded param from URL
        const newSearchParams = new URLSearchParams(searchParams.toString());
        newSearchParams.delete("upgraded");
        const newUrl = newSearchParams.toString()
          ? `${pathname}?${newSearchParams.toString()}`
          : pathname;
        router.replace(newUrl);
      }
    } catch (err) {
      logError("Error checking subscription status:", { error: err });
      setError(t("error.message"));
      setIsChecking(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
  };

  // Loading modal while checking subscription
  if (isChecking) {
    return (
      <Dialog open={true}>
        <DialogContent hideClose className="sm:max-w-md">
          <DialogTitle>{t("loading.title")}</DialogTitle>
          <DialogDescription className="space-y-3">
            <div className="flex items-center justify-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              {t("loading.description")}
            </p>
            {retryCount > 0 && (
              <p className="text-center text-xs text-muted-foreground">
                {t("loading.attemptCount", { current: retryCount + 1 })}
              </p>
            )}
          </DialogDescription>
        </DialogContent>
      </Dialog>
    );
  }

  // Error modal
  if (error) {
    return (
      <Dialog open={true} onOpenChange={() => setError(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle>{t("error.title")}</DialogTitle>
          <DialogDescription className="space-y-3">
            <p className="text-sm text-muted-foreground">{error}</p>
          </DialogDescription>
        </DialogContent>
      </Dialog>
    );
  }

  // Success banner
  if (showBanner) {
    return (
      <div className="m-4 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-green-900 dark:text-green-100">
              {t("success.title")}
            </p>
            <p className="mt-1 text-sm text-green-800 dark:text-green-200">
              {t("success.description")}
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
            aria-label={t("success.dismissButton")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
