import { redirect, notFound } from "next/navigation";
import { Suspense } from "react";
import { CompanyJobsManager } from "@/app/recruiting/CompanyJobsManager";
import { CompanyHeader } from "@/app/recruiting/CompanyHeader";
import { UpgradeSuccessBanner } from "./UpgradeSuccessBanner";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Logger } from "next-axiom";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CompanyDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const logger = new Logger().with({
    function: "CompanyDetailPage",
    params: { id },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Fetch company details
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

  // Check if user is a member of this company
  const { data: membership, error: memberError } = await supabase
    .from("company_members")
    .select("*")
    .eq("company_id", company.id)
    .eq("user_id", user.id)
    .single();

  if (memberError || !membership) {
    logger.error("User is not a member of this company", {
      error: memberError,
    });
    await logger.flush();
    redirect("/recruiting");
  }

  // Check if company has a subscription
  const { data: subscription } = await supabase
    .from("recruiting_subscriptions")
    .select("company_id")
    .eq("company_id", company.id)
    .single();

  const isFreeTier = !subscription;

  // Fetch jobs for this company
  const { data: jobs, error: jobsError } = await supabase
    .from("custom_jobs")
    .select(
      `
      *,
      company_job_candidates (count)
    `
    )
    .eq("company_id", company.id)
    .order("created_at", { ascending: false });

  if (jobsError) {
    logger.error("Error fetching jobs", { error: jobsError });
    await logger.flush();
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Suspense fallback={null}>
          <UpgradeSuccessBanner companyId={id} />
        </Suspense>
        
        <CompanyHeader company={company} isFreeTier={isFreeTier} />

        <div className="mt-8">
          <CompanyJobsManager companyId={id} jobs={jobs ?? []} />
        </div>
      </div>
    </div>
  );
}
