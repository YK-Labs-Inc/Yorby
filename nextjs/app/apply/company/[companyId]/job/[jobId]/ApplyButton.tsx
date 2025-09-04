"use client";

import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import Link from "next/link";

interface ApplyButtonProps {
  companyId: string;
  jobId: string;
}

export default function ApplyButton({ companyId, jobId }: ApplyButtonProps) {
  const t = useTranslations("apply");

  return (
    <Link href={`/apply/company/${companyId}/job/${jobId}/application`}>
      {" "}
      <Button type="submit" size="lg" className="w-full ">
        {t("jobPage.buttons.applyNow")}
      </Button>
    </Link>
  );
}
