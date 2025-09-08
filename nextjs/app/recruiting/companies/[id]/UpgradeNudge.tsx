"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Users, Infinity, X } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { UpgradeButton } from "./UpgradeButton";
import {
  FREE_TIER_INTERVIEW_COUNT,
  PRO_TIER_INTERVIEW_COUNT,
} from "./jobs/[jobId]/candidates/constants";

interface UpgradeNudgeProps {
  companyId: string;
}

export function UpgradeNudge({ companyId }: UpgradeNudgeProps) {
  const [dismissed, setDismissed] = useState(false);
  const router = useRouter();
  const t = useTranslations("apply.upgradeNudge");

  const handleDismiss = () => {
    setDismissed(true);
    // Remove showUpgrade search param from URL
    const url = new URL(window.location.href);
    url.searchParams.delete("showUpgrade");
    router.replace(url.pathname + url.search);
  };

  if (dismissed) return null;

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 mb-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full -translate-y-16 translate-x-16 opacity-30" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-100 rounded-full translate-y-12 -translate-x-12 opacity-40" />

      <CardContent className="p-6 relative">
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/50 transition-colors"
        >
          <X size={16} className="text-gray-500" />
        </button>

        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 bg-blue-500 p-2 rounded-full">
            <Zap className="w-6 h-6 text-white" />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge
                variant="secondary"
                className="bg-blue-100 text-blue-800 border-blue-200"
              >
                {t("welcomeBadge")}
              </Badge>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Scale Your Hiring with Yorby Pro
            </h3>

            <p className="text-gray-600 mb-4 leading-relaxed">
              Your free tier gives you{" "}
              <strong>{FREE_TIER_INTERVIEW_COUNT} candidate interviews</strong>{" "}
              across all job listings. Upgrade to Pro for{" "}
              <strong>$99/month</strong> and get {PRO_TIER_INTERVIEW_COUNT}{" "}
              interviews included, plus pay-as-you-grow pricing at just{" "}
              <strong>$0.50</strong> per additional interview.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-2 text-sm">
                <Zap className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <span className="text-gray-700">
                  {PRO_TIER_INTERVIEW_COUNT} interviews included + $0.50 each
                  after
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <span className="text-gray-700">
                  Unlimited candidate interviews
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <UpgradeButton companyId={companyId} />
              <Button
                variant="outline"
                onClick={handleDismiss}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                {t("buttons.maybeLater")}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
