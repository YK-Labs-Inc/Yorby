"use client";

import { useState } from "react";
import { Plus, Building2, Users, Briefcase, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { CreateCompanyDialog } from "./CreateCompanyDialog";
import { Tables } from "@/utils/supabase/database.types";
import { useTranslations } from "next-intl";

interface CompanyDashboardProps {
  companies: Tables<"companies">[];
  userId: string;
}

export function CompanyDashboard({ companies, userId }: CompanyDashboardProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const t = useTranslations("recruiting.companyDashboard");

  return (
    <>
      <div className="grid gap-6">
        {companies.length === 0 ? (
          /* Create Company Card - Only show when no companies */
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {t("createCard.title")}
              </h3>
              <p className="text-sm text-muted-foreground mb-4 text-center max-w-sm">
                {t("createCard.description")}
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                {t("createCard.button")}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{t("yourCompanies")}</h2>
              <Button onClick={() => setShowCreateDialog(true)} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                {t("createCard.button")}
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {companies.map((company) => (
                <Card
                  key={company.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">
                          {company.name}
                        </CardTitle>
                        <CardDescription>
                          {company.industry || t("noIndustrySpecified")}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      {company.website && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{t("website")}</span>
                          <a
                            href={company.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {new URL(company.website).hostname}
                          </a>
                        </div>
                      )}
                      {company.company_size && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>
                            {company.company_size} {t("employees")}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t">
                      <Link href={`/recruiting/companies/${company.id}`}>
                        <Button
                          variant="ghost"
                          className="w-full justify-between"
                        >
                          <span className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4" />
                            {t("manageJobs")}
                          </span>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      <CreateCompanyDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        userId={userId}
      />
    </>
  );
}
