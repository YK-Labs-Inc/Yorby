"use client";

import { CopyButton } from "@/components/ui/copy-button";
import { useTranslations } from "next-intl";
import { generateReferralLink } from "@/utils/referral";
import { usePostHog } from "posthog-js/react";
import { useUser } from "@/context/UserContext";

interface ReferralCodeSectionProps {
  referralCode: string | null;
  referralCount: number;
}

export function ReferralCodeSection({
  referralCode,
  referralCount,
}: ReferralCodeSectionProps) {
  const t = useTranslations("referrals");
  const posthog = usePostHog();
  const user = useUser();

  if (!referralCode) return null;

  const referralsNeeded = 3;
  const progress = Math.min((referralCount / referralsNeeded) * 100, 100);
  const referralLink = generateReferralLink(referralCode);
  const decodedLink = referralLink ? decodeURIComponent(referralLink) : null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
      <h2 className="text-lg font-semibold mb-4">{t("title")}</h2>
      <p className="text-gray-600 mb-4">{t("description")}</p>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>{t("progress.title")}</span>
          <span>{t("progress.count", { referralCount, referralsNeeded })}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-green-500 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("referralLink")}
          </label>
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-gray-50 rounded-md p-3 border border-gray-200">
              <code className="text-sm text-gray-900 break-all">
                {decodedLink}
              </code>
            </div>
            <CopyButton
              text={referralLink || ""}
              onCopy={() => {
                if (posthog && user?.id && referralCode) {
                  posthog.capture("referral_link_copied", {
                    userId: user.id,
                    referralCode,
                  });
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
