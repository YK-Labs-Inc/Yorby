import { redirect, notFound } from "next/navigation";
import { InterviewRoundsManager } from "./InterviewRoundsManager";
import { createSupabaseServerClient } from "@/utils/supabase/server";
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
    .select(
      `
      *,
      job_interview_questions:job_interview_questions(count),
      candidate_job_interviews:candidate_job_interviews(count)
    `
    )
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
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link
            href={`/recruiting/companies/${id}`}
            className="hover:text-foreground flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            {company?.name || t("breadcrumb.defaultCompany")}
          </Link>
          <span>/</span>
          <Link
            href={`/recruiting/companies/${id}/jobs/${jobId}`}
            className="hover:text-foreground flex items-center gap-1"
          >
            {job.job_title || t("breadcrumb.defaultJob")}
          </Link>
          <span>/</span>
          <span>{t("sections.interviewRounds.title")}</span>
        </div>

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
