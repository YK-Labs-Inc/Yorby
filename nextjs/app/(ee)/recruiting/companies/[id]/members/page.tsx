import { createSupabaseServerClient, createAdminClient } from "@/utils/supabase/server";
import { getServerUser } from "@/utils/auth/server";
import { notFound, redirect } from "next/navigation";
import { MembersTable } from "@/components/company/members-table";
import { MembersPageClient } from "./members-page-client";
import { Logger } from "next-axiom";
import { getTranslations } from "next-intl/server";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CompanyMembersPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const t = await getTranslations("company.members");

  const logger = new Logger().with({
    function: "CompanyMembersPage",
    params: { companyId: id },
  });

  // Get current user
  const user = await getServerUser();

  if (!user) {
    logger.error("User not authenticated");
    await logger.flush();
    redirect("/auth/sign-in");
  }

  // Get company details
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("*")
    .eq("id", id)
    .single();

  if (companyError || !company) {
    logger.error("Company not found", { error: companyError });
    await logger.flush();
    notFound();
  }

  // Check if user is a member of this company and get their role
  const { data: currentMember, error: memberError } = await supabase
    .from("company_members")
    .select("role")
    .eq("company_id", id)
    .eq("user_id", user.id)
    .not("accepted_at", "is", null)
    .single();

  if (memberError || !currentMember) {
    logger.error("User is not a member of this company", {
      error: memberError,
    });
    await logger.flush();
    redirect("/recruiting");
  }

  // Check if company has enterprise subscription for members feature
  const { data: subscription, error: subscriptionError } = await supabase
    .from("recruiting_subscriptions")
    .select("company_id")
    .eq("company_id", id)
    .single();

  if (subscriptionError || !subscription) {
    logger.info("Members feature requires enterprise subscription", {
      companyId: id,
      error: subscriptionError,
    });
    await logger.flush();
    redirect(`/recruiting/companies/${id}?upgrade=members`);
  }

  // Fetch all company members (both active and pending invitations)
  const { data: members, error: membersError } = await supabase
    .from("company_members")
    .select("*")
    .eq("company_id", id)
    .order("accepted_at", { ascending: false, nullsFirst: false })
    .order("invited_at", { ascending: false });

  if (membersError) {
    logger.error("Error fetching members", { error: membersError });
    await logger.flush();
  }

  // Fetch user emails for active members using admin client
  const adminClient = await createAdminClient();
  const membersWithUserInfo = await Promise.all(
    (members || []).map(async (member) => {
      if (member.user_id) {
        const { data: userData } = await adminClient.auth.admin.getUserById(
          member.user_id
        );
        return {
          ...member,
          userEmail: userData?.user?.email || null,
        };
      }
      return member;
    })
  );

  const canInvite = ["owner", "admin"].includes(currentMember.role);

  return (
    <MembersPageClient
      company={company}
      members={membersWithUserInfo}
      companyId={id}
      currentUserRole={currentMember.role}
      canInvite={canInvite}
    />
  );
}
