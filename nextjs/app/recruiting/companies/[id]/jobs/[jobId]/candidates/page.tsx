import { redirect, notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Logger } from "next-axiom";
import { H1 } from "@/components/typography";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PageProps {
  params: Promise<{
    id: string;
    jobId: string;
  }>;
}

export default async function CandidatesPage({ params }: PageProps) {
  const { id: companyId, jobId } = await params;

  const supabase = await createSupabaseServerClient();
  const logger = new Logger().with({
    function: "CandidatesPage",
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
          <span>Candidates</span>
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
          <H1 className="text-2xl sm:text-3xl">Candidates</H1>
          <p className="text-muted-foreground mt-2">
            Review and manage applicants for {job.job_title}
          </p>
        </div>

        {/* Placeholder content */}
        <Card>
          <CardHeader>
            <CardTitle>Coming Soon</CardTitle>
            <CardDescription>
              The candidates management feature is currently under development.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Soon you'll be able to:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-muted-foreground">
              <li>View all candidates who have applied to this position</li>
              <li>Review candidate profiles and resumes</li>
              <li>Schedule and conduct screening interviews</li>
              <li>Track candidate progress through your hiring pipeline</li>
              <li>Collaborate with team members on candidate evaluations</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}