import { redirect } from "next/navigation";
import { CompanyDashboard } from "@/app/recruiting/CompanyDashboard";
import { RecruitingDashboardSkeleton } from "@/app/recruiting/RecruitingDashboardSkeleton";
import { Suspense } from "react";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Logger } from "next-axiom";

async function RecruitingDashboardContent() {
  const supabase = await createSupabaseServerClient();
  const logger = new Logger().with({ path: "/recruiting/page" });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Fetch companies where user is a member
  const { data: memberCompanies, error: memberError } = await supabase
    .from("company_members")
    .select(
      `
      id,
      role,
      accepted_at,
      companies (
        *
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (memberError) {
    logger.error("Error fetching companies:", { error: memberError });
    await logger.flush();
  }

  const companies = memberCompanies?.map((member) => member.companies) ?? [];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <CompanyDashboard companies={companies} userId={user.id} />
      </div>
    </div>
  );
}

export default function RecruitingDashboard() {
  return (
    <Suspense fallback={<RecruitingDashboardSkeleton />}>
      <RecruitingDashboardContent />
    </Suspense>
  );
}
