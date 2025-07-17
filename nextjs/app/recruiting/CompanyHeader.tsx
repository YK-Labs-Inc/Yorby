"use client";

import { Building2, Globe, Users } from "lucide-react";
import { Tables } from "@/utils/supabase/database.types";
import Link from "next/link";
import { useTranslations } from "next-intl";

type Company = Tables<"companies">;

interface CompanyHeaderProps {
  company: Company;
}

export function CompanyHeader({ company }: CompanyHeaderProps) {
  const t = useTranslations("recruiting.companyHeader");

  return (
    <div className="space-y-6">
      {/* Back to dashboard */}
      <Link
        href="/recruiting"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        {t("backToDashboard")}
      </Link>

      {/* Company Info */}
      <div className="flex items-start justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{company.name}</h1>
              {company.industry && (
                <p className="text-muted-foreground">{company.industry}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-foreground"
              >
                <Globe className="h-4 w-4" />
                {new URL(company.website).hostname}
              </a>
            )}
            {company.company_size && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>{t("employees", { size: company.company_size })}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
