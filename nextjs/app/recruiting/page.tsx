import { redirect } from "next/navigation";
import { CompanyDashboard } from "@/app/recruiting/CompanyDashboard";
import { RecruitingDashboardSkeleton } from "@/app/recruiting/RecruitingDashboardSkeleton";
import { Suspense } from "react";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Logger } from "next-axiom";
import { getTranslations } from "next-intl/server";

async function RecruitingDashboardContent() {
  const supabase = await createSupabaseServerClient();
  const logger = new Logger().with({ path: "/recruiting/page" });
  const t = await getTranslations("recruiting.dashboard");

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>

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
