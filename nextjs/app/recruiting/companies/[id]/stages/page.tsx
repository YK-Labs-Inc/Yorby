import { redirect, notFound } from "next/navigation";
import { Suspense } from "react";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { getServerUser } from "@/utils/auth/server";
import { Logger } from "next-axiom";
import { CompanyApplicationStagesManager } from "./CompanyApplicationStagesManager";
import { CompanyStageHeader } from "./CompanyStageHeader";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CompanyApplicationStagesPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const logger = new Logger().with({
    function: "CompanyApplicationStagesPage",
    params: { id },
  });

  const user = await getServerUser();

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

  // Fetch existing application stages for this company
  const { data: stages, error: stagesError } = await supabase
    .from("company_application_stages")
    .select("*")
    .eq("company_id", company.id)
    .order("order_index", { ascending: true });

  if (stagesError) {
    logger.error("Error fetching application stages", { error: stagesError });
    await logger.flush();
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <CompanyStageHeader company={company} />

        <div className="mt-8">
          <CompanyApplicationStagesManager 
            companyId={id} 
            initialStages={stages ?? []} 
          />
        </div>
      </div>
    </div>
  );
}