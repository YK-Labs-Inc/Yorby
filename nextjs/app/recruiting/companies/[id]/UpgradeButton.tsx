"use client";

import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import Link from "next/link";

interface UpgradeButtonProps {
  companyId: string;
}

export function UpgradeButton({ companyId }: UpgradeButtonProps) {
  const t = useTranslations("apply");

  return (
    <Link href={`/recruiting-purchase/${companyId}`}>
      <Button>{t("freeTierBanner.viewPricing")}</Button>
    </Link>
  );
}
