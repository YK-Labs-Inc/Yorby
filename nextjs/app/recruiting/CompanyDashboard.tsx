"use client";

import { useState } from "react";
import {
  Plus,
  Building2,
  Users,
  MoreVertical,
  Edit,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { CompanyDetailPanel } from "./CompanyDetailPanel";
import { Tables } from "@/utils/supabase/database.types";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

interface CompanyDashboardProps {
  companies: Tables<"companies">[];
  userId: string;
}

export function CompanyDashboard({ companies, userId }: CompanyDashboardProps) {
  const [showPanel, setShowPanel] = useState(false);
  const [panelMode, setPanelMode] = useState<"create" | "edit">("create");
  const [selectedCompany, setSelectedCompany] =
    useState<Tables<"companies"> | null>(null);
  const t = useTranslations("recruiting.companyDashboard");
  const router = useRouter();

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">{t("title")}</h2>
            <p className="text-muted-foreground">{t("subtitle")}</p>
          </div>
          <Button
            onClick={() => {
              setPanelMode("create");
              setSelectedCompany(null);
              setShowPanel(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("createCard.button")}
          </Button>
        </div>

        {companies.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {t("createCard.title")}
              </h3>
              <p className="text-sm text-muted-foreground mb-4 text-center max-w-sm">
                {t("createCard.description")}
              </p>
              <Button
                onClick={() => {
                  setPanelMode("create");
                  setSelectedCompany(null);
                  setShowPanel(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                {t("createCard.button")}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="border rounded-lg">
            <div className="max-h-[600px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[30%]">
                      {t("table.companyName")}
                    </TableHead>
                    <TableHead className="w-[25%]">
                      {t("table.industry")}
                    </TableHead>
                    <TableHead className="w-[20%]">
                      {t("table.website")}
                    </TableHead>
                    <TableHead className="w-[15%]">{t("table.size")}</TableHead>
                    <TableHead className="w-[5%]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/recruiting/companies/${company.id}`}
                          className="hover:underline"
                        >
                          {company.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {company.industry || t("noIndustrySpecified")}
                      </TableCell>
                      <TableCell>
                        {company.website ? (
                          <a
                            href={company.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-muted-foreground hover:underline"
                          >
                            {company.website}
                          </a>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            -
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {company.company_size ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>{company.company_size}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            -
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setPanelMode("edit");
                                setSelectedCompany(company);
                                setShowPanel(true);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              {t("actions.edit") || "Edit"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      <CompanyDetailPanel
        open={showPanel}
        onOpenChange={setShowPanel}
        userId={userId}
        mode={panelMode}
        company={selectedCompany}
      />
    </>
  );
}
