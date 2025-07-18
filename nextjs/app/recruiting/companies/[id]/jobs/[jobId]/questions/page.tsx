import { redirect, notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Logger } from "next-axiom";
import { H1 } from "@/components/typography";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import QuestionsTable from "../QuestionsTable";

interface PageProps {
  params: Promise<{
    id: string;
    jobId: string;
  }>;
}

export default async function QuestionsPage({ params }: PageProps) {
  const { id: companyId, jobId } = await params;

  const supabase = await createSupabaseServerClient();
  const logger = new Logger().with({
    function: "QuestionsPage",
    params: { companyId, jobId },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Check if user is a member of this company
  const { data: membership, error: memberError } = await supabase
    .from("company_members")
    .select("role")
    .eq("company_id", companyId)
    .eq("user_id", user.id)
    .single();

  if (memberError || !membership) {
    logger.error("User is not a member of this company", {
      error: memberError,
    });
    await logger.flush();
    redirect("/recruiting");
  }

  // Only owners, admins, and recruiters can manage jobs
  const canManageJob = ["owner", "admin", "recruiter"].includes(
    membership.role
  );
  if (!canManageJob) {
    logger.error("User does not have permission to manage jobs", {
      role: membership.role,
    });
    await logger.flush();
    redirect(`/recruiting/companies/${companyId}`);
  }

  // Fetch job details
  const { data: job, error: jobError } = await supabase
    .from("custom_jobs")
    .select("id, job_title, company_name")
    .eq("id", jobId)
    .eq("company_id", companyId)
    .single();

  if (jobError || !job) {
    logger.error("Job not found", { error: jobError });
    await logger.flush();
    notFound();
  }

  // Get company details for breadcrumb
  const { data: company } = await supabase
    .from("companies")
    .select("name")
    .eq("id", companyId)
    .single();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link
            href={`/recruiting/companies/${companyId}`}
            className="hover:text-foreground"
          >
            {company?.name || "Company"}
          </Link>
          <span>/</span>
          <Link
            href={`/recruiting/companies/${companyId}/jobs/${jobId}`}
            className="hover:text-foreground"
          >
            {job.job_title}
          </Link>
          <span>/</span>
          <span>Questions</span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/recruiting/companies/${companyId}/jobs/${jobId}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Job Details
          </Link>
          <H1 className="text-2xl sm:text-3xl">Interview Questions</H1>
          <p className="text-muted-foreground mt-2">
            Manage screening questions for {job.job_title}
          </p>
        </div>

        <QuestionsTable jobId={jobId} />
      </div>
    </div>
  );
}