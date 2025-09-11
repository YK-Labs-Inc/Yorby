"use client";

import { ArrowLeft, Building2, Workflow } from "lucide-react";
import { Tables } from "@/utils/supabase/database.types";
import Link from "next/link";
import { useTranslations } from "next-intl";

type Company = Tables<"companies">;

interface CompanyStageHeaderProps {
  company: Company;
}

export function CompanyStageHeader({ company }: CompanyStageHeaderProps) {
  const t = useTranslations("apply.recruiting.applicationStages");

  return (
    <div className="space-y-6">
      {/* Back to company dashboard */}
      <Link
        href={`/recruiting/companies/${company.id}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        <span>{t("backToCompany")}</span>
      </Link>

      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Workflow className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{t("title")}</h1>
            <p className="text-muted-foreground">
              {t("subtitle", { companyName: company.name })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
