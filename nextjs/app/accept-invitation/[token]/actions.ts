"use server";

import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Logger } from "next-axiom";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function acceptInvitation(
  prevState: { error?: string; success: boolean },
  formData: FormData
) {
  const token = formData.get("token") as string;
  let companyId: string | null = null;
  const t = await getTranslations("company.acceptInvitation.errors");

  const logger = new Logger().with({
    function: "acceptInvitation",
    params: { token },
  });

  try {
    const supabase = await createSupabaseServerClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.error("User not authenticated", { error: authError });
      await logger.flush();
      return {
        error: t("notAuthenticated"),
        success: false,
      };
    }

    // Find the invitation by token
    const { data: invitation, error: inviteError } = await supabase
      .from("company_members")
      .select("*, companies(*)")
      .eq("invitation_token", token)
      .is("accepted_at", null)
      .single();

    if (inviteError || !invitation) {
      logger.error("Invitation not found", { error: inviteError, token });
      await logger.flush();
      return {
        error: t("invalidOrAccepted"),
        success: false,
      };
    }
    companyId = invitation.company_id;

    // Check if invitation has expired
    if (invitation.invitation_expires_at) {
      const expirationDate = new Date(invitation.invitation_expires_at);
      if (expirationDate < new Date()) {
        logger.info("Invitation has expired", { token, expirationDate });
        await logger.flush();
        return {
          error: t("expired"),
          success: false,
        };
      }
    }

    // Check if user is already a member of this company
    const { data: existingMembership } = await supabase
      .from("company_members")
      .select("id")
      .eq("company_id", invitation.company_id)
      .eq("user_id", user.id)
      .not("id", "eq", invitation.id)
      .single();

    if (existingMembership) {
      logger.info("User is already a member of this company", {
        userId: user.id,
        companyId: invitation.company_id,
      });
      await logger.flush();
      return {
        error: t("alreadyMember"),
        success: false,
      };
    }

    // Accept the invitation by updating the record
    const { error: updateError } = await supabase
      .from("company_members")
      .update({
        user_id: user.id,
        accepted_at: new Date().toISOString(),
        invitation_email: null, // Clear invitation-specific fields
        invitation_token: null,
        invitation_expires_at: null,
      })
      .eq("id", invitation.id);

    if (updateError) {
      logger.error("Failed to accept invitation", { error: updateError });
      await logger.flush();
      return {
        error: t("acceptFailed"),
        success: false,
      };
    }

    logger.info("Invitation accepted successfully", {
      userId: user.id,
      companyId: invitation.company_id,
      invitationId: invitation.id,
    });
    await logger.flush();
  } catch (error) {
    logger.error("Unexpected error accepting invitation", { error });
    await logger.flush();
    return { error: t("unexpected"), success: false };
  }

  if (companyId) {
    redirect(`/recruiting/companies/${companyId}`);
  }

  return { error: "An unexpected error occurred", success: false };
}

export async function getInvitationDetails(token: string) {
  const logger = new Logger().with({
    function: "getInvitationDetails",
    params: { token },
  });

  try {
    const supabase = await createSupabaseServerClient();

    // Get the invitation details
    const { data: invitation, error } = await supabase
      .from("company_members")
      .select(
        `
        *,
        companies (
          id,
          name,
          industry,
          company_size
        )
      `
      )
      .eq("invitation_token", token)
      .is("accepted_at", null)
      .single();

    if (error || !invitation) {
      logger.error("Invitation not found", { error, token });
      await logger.flush();
      return null;
    }

    // Check if expired
    const isExpired = invitation.invitation_expires_at
      ? new Date(invitation.invitation_expires_at) < new Date()
      : false;

    return {
      ...invitation,
      isExpired,
    };
  } catch (error) {
    logger.error("Error fetching invitation details", { error });
    await logger.flush();
    return null;
  }
}
