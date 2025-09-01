"use server";

import { Enums } from "@/utils/supabase/database.types";
import {
  createSupabaseServerClient,
  createAdminClient,
} from "@/utils/supabase/server";
import { getServerUser } from "@/utils/auth/server";
import { Logger } from "next-axiom";
import { getTranslations } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { Resend } from "resend";
import { CompanyInvitationTemplate } from "@/components/email/CompanyInvitationTemplate";

/**
 * Check if the user has admin or owner permissions for a company
 * @returns The member role if authorized, null otherwise
 */
const checkUserIsCompanyAdmin = async (
  companyId: string,
  userId: string
): Promise<boolean> => {
  const supabase = await createSupabaseServerClient();
  const { data: member, error: memberError } = await supabase
    .from("company_members")
    .select("role")
    .eq("company_id", companyId)
    .eq("user_id", userId)
    .not("accepted_at", "is", null)
    .single();

  if (memberError || !member || !["owner", "admin"].includes(member.role)) {
    return false;
  }

  return true;
};

export async function inviteCompanyMember(
  prevState: { error?: string; success: boolean },
  formData: FormData
) {
  const email = formData.get("email") as string;
  const role = formData.get("role") as Enums<"company_member_role">;
  const companyId = formData.get("company_id") as string;

  const logger = new Logger().with({
    function: "inviteCompanyMember",
    params: { email, role, companyId },
  });

  try {
    const supabase = await createSupabaseServerClient();
    const t = await getTranslations("company.invitePanel.errors");

    // Get current user
    const user = await getServerUser();

    if (!user) {
      logger.error("User not authenticated");
      await logger.flush();
      return { error: t("unauthorized"), success: false };
    }

    // Check if user has permission (owner/admin)
    const memberRole = await checkUserIsCompanyAdmin(companyId, user.id);

    if (!memberRole) {
      logger.error("User lacks permission to invite");
      await logger.flush();
      return { error: t("permissionDenied"), success: false };
    }

    // Check if this user is already a member
    const { data: existingMember } = await supabase
      .from("company_members")
      .select("user_id")
      .eq("invitation_email", email)
      .not("accepted_at", "is", null)
      .not("user_id", "is", null)
      .maybeSingle();

    if (existingMember) {
      logger.info("User already a member", { email });
      await logger.flush();
      return { error: t("alreadyMember"), success: false };
    }

    // Check for existing pending invitation
    const { data: pendingInvite } = await supabase
      .from("company_members")
      .select("id")
      .eq("company_id", companyId)
      .eq("invitation_email", email)
      .is("accepted_at", null)
      .maybeSingle();

    if (pendingInvite) {
      logger.info("Invitation already exists", { email });
      await logger.flush();
      return { error: t("alreadyInvited"), success: false };
    }

    // Create invitation record
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    const { data: invitation, error: insertError } = await supabase
      .from("company_members")
      .insert({
        company_id: companyId,
        invitation_email: email,
        invitation_expires_at: expiresAt.toISOString(),
        role,
        invited_by: user.id,
        invited_at: new Date().toISOString(),
      })
      .select("invitation_token")
      .single();

    if (insertError) {
      logger.error("Failed to create invitation", { error: insertError });
      await logger.flush();
      return { error: t("sendFailed"), success: false };
    }

    if (!invitation.invitation_token) {
      logger.error("Failed to create invitation", { error: insertError });
      await logger.flush();
      return { error: t("sendFailed"), success: false };
    }

    // Get company details for the email
    const { data: company } = await supabase
      .from("companies")
      .select("name")
      .eq("id", companyId)
      .single();

    if (!company) {
      logger.error("Company not found", { companyId });
      await logger.flush();
      return { error: t("companyNotFound"), success: false };
    }

    const inviterName = user.user_metadata.display_name || user.email;
    // Send invitation email using Resend
    const origin =
      (await headers()).get("origin") || process.env.NEXT_PUBLIC_APP_URL;

    const invitationLink = `${origin}/accept-invitation/${invitation.invitation_token}?email=${email}`;

    try {
      const resend = new Resend(process.env.RESEND_API_KEY!);
      await resend.emails.send({
        from: "Yorby <noreply@noreply-recruiting.yorby.ai>",
        to: [email],
        subject: `You're invited to join ${company.name} on Yorby`,
        react: CompanyInvitationTemplate({
          companyName: company.name,
          inviterName,
          role,
          invitationLink,
          expiresIn: "7 days",
        }),
      });
    } catch (emailError) {
      // If email fails, delete the invitation record
      await supabase
        .from("company_members")
        .delete()
        .eq("invitation_token", invitation.invitation_token);

      logger.error("Failed to send invitation email", { error: emailError });
      await logger.flush();
      return { error: t("sendFailed"), success: false };
    }

    revalidatePath(`/recruiting/companies/${companyId}/members`);

    logger.info("Invitation sent successfully", { email, companyId });
    await logger.flush();

    return { error: undefined, success: true };
  } catch (error) {
    logger.error("Unexpected error in inviteCompanyMember", { error });
    await logger.flush();
    const t = await getTranslations("company.invitePanel.errors");
    return { error: t("unexpected"), success: false };
  }
}

export async function cancelInvitation(
  prevState: { error?: string; success: boolean },
  formData: FormData
) {
  const invitationId = formData.get("invitation_id") as string;
  const companyId = formData.get("company_id") as string;

  const logger = new Logger().with({
    function: "cancelInvitation",
    params: { invitationId, companyId },
  });

  try {
    const supabase = await createSupabaseServerClient();
    const t = await getTranslations("company.cancelInvitation");

    // Get current user
    const user = await getServerUser();

    if (!user) {
      logger.error("User not authenticated");
      await logger.flush();
      return { error: t("error"), success: false };
    }

    // Check if user has permission (owner/admin)
    const memberRole = await checkUserIsCompanyAdmin(companyId, user.id);

    if (!memberRole) {
      logger.error("User lacks permission to cancel invitations");
      await logger.flush();
      return { error: t("error"), success: false };
    }

    // Delete the invitation
    const { error: deleteError } = await supabase
      .from("company_members")
      .delete()
      .eq("id", invitationId)
      .eq("company_id", companyId)
      .is("user_id", null); // Ensure we're only deleting invitations

    if (deleteError) {
      logger.error("Failed to cancel invitation", { error: deleteError });
      await logger.flush();
      return { error: t("error"), success: false };
    }

    revalidatePath(`/recruiting/companies/${companyId}/members`);

    logger.info("Invitation cancelled", { invitationId });
    await logger.flush();

    return { error: undefined, success: true };
  } catch (error) {
    logger.error("Unexpected error in cancelInvitation", { error });
    await logger.flush();
    const t = await getTranslations("company.cancelInvitation");
    return { error: t("error"), success: false };
  }
}

export async function resendInvitation(
  prevState: { error?: string; success: boolean },
  formData: FormData
) {
  const invitationId = formData.get("invitation_id") as string;
  const companyId = formData.get("company_id") as string;

  const logger = new Logger().with({
    function: "resendInvitation",
    params: { invitationId, companyId },
  });

  try {
    const supabase = await createSupabaseServerClient();
    const t = await getTranslations("company.resendInvitation");

    // Get current user
    const user = await getServerUser();

    if (!user) {
      logger.error("User not authenticated");
      await logger.flush();
      return { error: t("error"), success: false };
    }

    // Check if user has permission (owner/admin)
    const memberRole = await checkUserIsCompanyAdmin(companyId, user.id);

    if (!memberRole) {
      logger.error("User lacks permission to resend invitations");
      await logger.flush();
      return { error: t("error"), success: false };
    }

    // Get the invitation details
    const { data: invitation, error: inviteError } = await supabase
      .from("company_members")
      .select("invitation_email, invitation_token, role")
      .eq("id", invitationId)
      .eq("company_id", companyId)
      .is("user_id", null)
      .maybeSingle();

    if (inviteError || !invitation || !invitation.invitation_email) {
      logger.error("Invitation not found", { error: inviteError });
      await logger.flush();
      return { error: t("error"), success: false };
    }

    // Update expiration date
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    const { error: updateError } = await supabase
      .from("company_members")
      .update({
        invitation_expires_at: newExpiresAt.toISOString(),
        invited_at: new Date().toISOString(),
      })
      .eq("id", invitationId);

    if (updateError) {
      logger.error("Failed to update invitation", { error: updateError });
      await logger.flush();
      return { error: t("error"), success: false };
    }

    // Get company details for the email
    const { data: company } = await supabase
      .from("companies")
      .select("name")
      .eq("id", companyId)
      .single();

    // Get inviter's name using admin client
    const adminClient = await createAdminClient();
    const { data: inviterData } = await adminClient.auth.admin.getUserById(
      user.id
    );
    const inviterEmail = inviterData?.user?.email;
    const inviterName = inviterEmail ? inviterEmail.split("@")[0] : undefined;

    // Resend invitation email using Resend
    const origin =
      (await headers()).get("origin") || process.env.NEXT_PUBLIC_APP_URL;

    const invitationLink = `${origin}/accept-invitation/${invitation.invitation_token}`;

    try {
      const resend = new Resend(process.env.RESEND_API_KEY!);
      await resend.emails.send({
        from: "Perfect Interview <noreply@transactional.perfectinterview.ai>",
        to: [invitation.invitation_email],
        subject: `Reminder: You're invited to join ${company?.name || "a company"}`,
        react: CompanyInvitationTemplate({
          companyName: company?.name || "the company",
          inviterName,
          role: invitation.role,
          invitationLink,
          expiresIn: "7 days",
        }),
      });
    } catch (emailError) {
      logger.error("Failed to resend invitation email", { error: emailError });
      await logger.flush();
      return { error: t("error"), success: false };
    }

    revalidatePath(`/recruiting/companies/${companyId}/members`);

    logger.info("Invitation resent", { invitationId });
    await logger.flush();

    return { error: undefined, success: true };
  } catch (error) {
    logger.error("Unexpected error in resendInvitation", { error });
    await logger.flush();
    const t = await getTranslations("company.resendInvitation");
    return { error: t("error"), success: false };
  }
}
