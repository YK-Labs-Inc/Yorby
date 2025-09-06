"use client";

import { useState } from "react";
import { MembersTable } from "@/components/company/members-table";
import { InviteMemberPanel } from "@/components/company/invite-member-panel";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Tables } from "@/utils/supabase/database.types";

type CompanyMember = Tables<"company_members"> & {
  userEmail?: string | null;
};

interface MembersPageClientProps {
  company: Tables<"companies">;
  members: CompanyMember[];
  companyId: string;
  currentUserRole: string;
  canInvite: boolean;
}

export function MembersPageClient({
  company,
  members,
  companyId,
  currentUserRole,
  canInvite,
}: MembersPageClientProps) {
  const t = useTranslations("company.members");
  const [panelOpen, setPanelOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{company.name}</h1>
              <p className="text-muted-foreground mt-2">{t("title")}</p>
            </div>
            {canInvite && (
              <Button onClick={() => setPanelOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                {t("inviteButton")}
              </Button>
            )}
          </div>
        </div>

        {/* Members Table */}
        <MembersTable
          members={members}
          companyId={companyId}
          currentUserRole={currentUserRole}
        />

        {/* Invite Panel */}
        {canInvite && (
          <InviteMemberPanel
            open={panelOpen}
            onOpenChange={setPanelOpen}
            companyId={companyId}
            currentUserRole={currentUserRole}
          />
        )}
      </div>
    </div>
  );
}