"use client";

import { useState, useActionState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslations } from "next-intl";
import { MoreHorizontal, Mail, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  cancelInvitation,
  resendInvitation,
} from "@/app/(ee)/recruiting/companies/[id]/members/actions";
import { Tables } from "@/utils/supabase/database.types";

type CompanyMember = Tables<"company_members"> & {
  userEmail?: string | null;
};

interface MembersTableProps {
  members: CompanyMember[];
  companyId: string;
  currentUserRole: string;
}

export function MembersTable({
  members,
  companyId,
  currentUserRole,
}: MembersTableProps) {
  const t = useTranslations("company");
  const [selectedInvitation, setSelectedInvitation] = useState<string | null>(
    null
  );

  // Separate active members and pending invitations
  const activeMembers = members.filter((m) => m.accepted_at !== null);
  const pendingInvitations = members.filter((m) => m.accepted_at === null);

  // Cancel invitation action
  const [cancelState, cancelFormAction, isCancelling] = useActionState(
    cancelInvitation,
    { error: undefined, success: false }
  );

  // Resend invitation action
  const [resendState, resendFormAction, isResending] = useActionState(
    resendInvitation,
    { error: undefined, success: false }
  );

  // Handle cancel state changes
  useEffect(() => {
    if (cancelState.success) {
      toast.success(t("cancelInvitation.success"));
      setSelectedInvitation(null);
    } else if (cancelState.error) {
      toast.error(cancelState.error);
    }
  }, [cancelState, isCancelling, selectedInvitation, t]);

  // Handle resend state changes
  useEffect(() => {
    if (resendState.success) {
      toast.success(t("resendInvitation.success"));
      setSelectedInvitation(null);
    } else if (resendState.error) {
      toast.error(resendState.error);
    }
  }, [resendState, isResending, selectedInvitation, t]);

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "owner":
        return "default";
      case "admin":
        return "secondary";
      case "recruiter":
        return "outline";
      default:
        return "outline";
    }
  };

  const canManageInvitations = ["owner", "admin"].includes(currentUserRole);

  const isInvitationExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <Tabs defaultValue="active" className="w-full">
      <TabsList>
        <TabsTrigger value="active">
          {t("members.tabs.active")} ({activeMembers.length})
        </TabsTrigger>
        <TabsTrigger value="pending">
          {t("members.tabs.pending")} ({pendingInvitations.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="active">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("members.table.name")}</TableHead>
                <TableHead>{t("members.table.email")}</TableHead>
                <TableHead>{t("members.table.role")}</TableHead>
                <TableHead>{t("members.table.joinedDate")}</TableHead>
                {canManageInvitations && (
                  <TableHead className="w-[50px]"></TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeMembers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground"
                  >
                    No members yet
                  </TableCell>
                </TableRow>
              ) : (
                activeMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.userEmail
                        ? member.userEmail.split("@")[0]
                        : "Member"}
                    </TableCell>
                    <TableCell>{member.userEmail || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(member.role)}>
                        {t(`members.roles.${member.role}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {member.accepted_at
                        ? formatDistanceToNow(new Date(member.accepted_at), {
                            addSuffix: true,
                          })
                        : "—"}
                    </TableCell>
                    {canManageInvitations && (
                      <TableCell>
                        {member.role !== "owner" &&
                          currentUserRole === "owner" && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem disabled>
                                  {t("members.actions.remove")}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </TabsContent>

      <TabsContent value="pending">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("members.table.email")}</TableHead>
                <TableHead>{t("members.table.role")}</TableHead>
                <TableHead>{t("members.table.status")}</TableHead>
                <TableHead>{t("members.table.invitedDate")}</TableHead>
                <TableHead>{t("members.table.expires")}</TableHead>
                {canManageInvitations && (
                  <TableHead className="w-[50px]"></TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingInvitations.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground"
                  >
                    No pending invitations
                  </TableCell>
                </TableRow>
              ) : (
                pendingInvitations.map((invitation) => {
                  const isExpired = isInvitationExpired(
                    invitation.invitation_expires_at
                  );
                  return (
                    <TableRow key={invitation.id}>
                      <TableCell className="font-medium">
                        {invitation.invitation_email}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(invitation.role)}>
                          {t(`members.roles.${invitation.role}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {isExpired ? (
                          <Badge variant="destructive">
                            {t("members.status.expired")}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            {t("members.status.pending")}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {invitation.invited_at
                          ? formatDistanceToNow(
                              new Date(invitation.invited_at),
                              { addSuffix: true }
                            )
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {invitation.invitation_expires_at
                          ? formatDistanceToNow(
                              new Date(invitation.invitation_expires_at),
                              { addSuffix: true }
                            )
                          : "—"}
                      </TableCell>
                      {canManageInvitations && (
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedInvitation(invitation.id);
                                  const form = document.createElement("form");
                                  form.action = "";
                                  form.innerHTML = `
                                    <input type="hidden" name="invitation_id" value="${invitation.id}" />
                                    <input type="hidden" name="company_id" value="${companyId}" />
                                  `;
                                  document.body.appendChild(form);
                                  resendFormAction(new FormData(form));
                                  document.body.removeChild(form);
                                }}
                                disabled={
                                  isResending &&
                                  selectedInvitation === invitation.id
                                }
                              >
                                <Mail className="mr-2 h-4 w-4" />
                                {t("members.actions.resend")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  setSelectedInvitation(invitation.id);
                                  const form = document.createElement("form");
                                  form.action = "";
                                  form.innerHTML = `
                                    <input type="hidden" name="invitation_id" value="${invitation.id}" />
                                    <input type="hidden" name="company_id" value="${companyId}" />
                                  `;
                                  document.body.appendChild(form);
                                  cancelFormAction(new FormData(form));
                                  document.body.removeChild(form);
                                }}
                                disabled={
                                  isCancelling &&
                                  selectedInvitation === invitation.id
                                }
                              >
                                <X className="mr-2 h-4 w-4" />
                                {t("members.actions.cancel")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </TabsContent>
    </Tabs>
  );
}
