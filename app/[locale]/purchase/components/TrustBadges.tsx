import { ShieldCheck, RefreshCcw, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";

export default function TrustBadges() {
  const t = useTranslations();
  return (
    <div className="flex flex-wrap justify-center gap-4 mt-4">
      <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/30 px-4 py-2 rounded-full text-green-700 dark:text-green-200 text-sm font-medium">
        <RefreshCcw className="w-5 h-5" />
        {t("purchase.trustBadges.guarantee")}
      </div>
      <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 px-4 py-2 rounded-full text-blue-700 dark:text-blue-200 text-sm font-medium">
        <ShieldCheck className="w-5 h-5" />
        {t("purchase.trustBadges.secure")}
      </div>
      <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800/60 px-4 py-2 rounded-full text-gray-700 dark:text-gray-200 text-sm font-medium">
        <XCircle className="w-5 h-5" />
        {t("purchase.trustBadges.cancel")}
      </div>
    </div>
  );
}
