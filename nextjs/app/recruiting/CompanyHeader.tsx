"use client";

import {
  ArrowLeft,
  Building2,
  Globe,
  Users,
  UsersRound,
  Workflow,
} from "lucide-react";
import { Tables } from "@/utils/supabase/database.types";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { CompanyUpgradeDialog } from "./CompanyUpgradeDialog";

type Company = Tables<"companies">;

interface CompanyHeaderProps {
  company: Company;
  isFreeTier: boolean;
}

export function CompanyHeader({ company, isFreeTier }: CompanyHeaderProps) {
  const t = useTranslations("apply.recruiting.companyHeader");
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  return (
    <div className="space-y-6">
      {/* Back to dashboard */}
      <Link
        href="/recruiting"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        <span>{t("backToDashboard")}</span>
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
              <p>
                <Globe className="h-4 w-4" />
                {company.website}
              </p>
            )}
            {company.company_size && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>{t("employees", { size: company.company_size })}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Link href={`/recruiting/companies/${company.id}/stages`}>
            <Button variant="outline">
              <Workflow className="mr-2 h-4 w-4" />
              {t("manageStages")}
            </Button>
          </Link>
          {isFreeTier ? (
            <Button
              variant="outline"
              onClick={() => setShowUpgradeDialog(true)}
            >
              <UsersRound className="mr-2 h-4 w-4" />
              {t("manageMembers")}
            </Button>
          ) : (
            <Link href={`/recruiting/companies/${company.id}/members`}>
              <Button variant="outline">
                <UsersRound className="mr-2 h-4 w-4" />
                {t("manageMembers")}
              </Button>
            </Link>
          )}
        </div>
      </div>

      <CompanyUpgradeDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        companyId={company.id}
      />
    </div>
  );
}
