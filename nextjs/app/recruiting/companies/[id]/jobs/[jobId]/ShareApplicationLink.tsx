"use client";
import { ShareButton } from "@/components/ui/share-button";
import { useTranslations } from "next-intl";

export default function ShareApplicationLink({
  companyId,
  jobId,
}: {
  companyId: string;
  jobId: string;
}) {
  const t = useTranslations("apply.recruiting");
  return (
    <div className="flex gap-2 items-center">
      <ShareButton
        titleOverride={t("shareApplicationLink")}
        url={`${origin}/apply/company/${companyId}/job/${jobId}`}
      />
    </div>
  );
}
