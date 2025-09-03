import { redirect, notFound } from "next/navigation";
import { InterviewRoundsManager } from "./InterviewRoundsManager";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { getServerUser } from "@/utils/auth/server";
import { Logger } from "next-axiom";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

interface PageProps {
  params: Promise<{
    id: string;
    jobId: string;
  }>;
}

export default async function CompanyDetailPage({ params }: PageProps) {
  const { id, jobId } = await params;
  const supabase = await createSupabaseServerClient();
  const logger = new Logger().with({
    function: "CompanyDetailPage",
    params: { id, jobId },
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

  const { data: job, error: jobError } = await supabase
    .from("custom_jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (jobError || !job) {
    logger.error("Job not found", { error: jobError });
    await logger.flush();
    notFound();
  }

  // Fetch interviews for this job
  const { data: interviews, error: interviewsError } = await supabase
    .from("job_interviews")
    .select("*")
    .eq("custom_job_id", jobId)
    .order("order_index", { ascending: true });

  if (interviewsError) {
    logger.error("Error fetching interviews", { error: interviewsError });
    await logger.flush();
  }

  const t = await getTranslations("apply.recruiting.jobDetail");

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        {/* Back button */}
        <Link
          href={`/recruiting/companies/${id}/jobs/${jobId}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group mb-6"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>{t("back")}</span>
        </Link>

        <div className="mt-8">
          <InterviewRoundsManager
            jobId={jobId}
            interviews={interviews ?? []}
            companyId={id}
          />
        </div>
      </div>
    </div>
  );
}
