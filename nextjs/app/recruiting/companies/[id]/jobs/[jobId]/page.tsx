import { redirect, notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { getServerUser } from "@/utils/auth/server";
import { Logger } from "next-axiom";
import { H1 } from "@/components/typography";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  ClipboardList,
  Calendar,
  Building,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ShareApplicationSection from "./ShareApplicationSection";
import JobDescriptionToggle from "./JobDescriptionToggle";

interface PageProps {
  params: Promise<{
    id: string;
    jobId: string;
  }>;
}

export default async function CompanyJobDetailPage({ params }: PageProps) {
  const { id: companyId, jobId } = await params;

  const supabase = await createSupabaseServerClient();
  const logger = new Logger().with({
    function: "CompanyJobDetailPage",
    params: { companyId, jobId },
  });

  // Get translations
  const t = await getTranslations("apply.recruiting.jobDetail");

  const user = await getServerUser();

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
      error: memberError?.message,
      userId: user.id,
      companyId,
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
      userId: user.id,
      companyId,
      jobId,
    });
    await logger.flush();
    redirect(`/recruiting/companies/${companyId}`);
  }

  // Fetch job details
  const { data: job, error: jobError } = await supabase
    .from("custom_jobs")
    .select(
      `
      *,
      company_job_candidates (count)
    `
    )
    .eq("id", jobId)
    .eq("company_id", companyId)
    .single();

  if (jobError || !job) {
    logger.error("Job not found", {
      error: jobError?.message,
      jobId,
      companyId,
      userId: user.id,
    });
    await logger.flush();
    notFound();
  }

  // Fetch additional stats in parallel
  const [interviewsResult] = await Promise.all([
    supabase
      .from("job_interviews")
      .select("id", { count: "exact" })
      .eq("custom_job_id", jobId),
  ]);

  const totalInterviewRounds = interviewsResult.count || 0;

  // Format date
  const postedDate = job.created_at
    ? new Date(job.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Back button */}
        <Link
          href={`/recruiting/companies/${companyId}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group mb-6"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>{t("back")}</span>
        </Link>

        {/* Hero Section with Job Title and Quick Actions */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <H1 className="text-3xl sm:text-4xl font-bold mb-3">
                {job.job_title}
              </H1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {job.company_name && (
                  <div className="flex items-center gap-1.5">
                    <Building className="h-4 w-4" />
                    <span>{job.company_name}</span>
                  </div>
                )}
                {postedDate && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    <span>{t("metadata.posted", { date: postedDate })}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Share Application Section */}
          <ShareApplicationSection companyId={companyId} jobId={jobId} />

          {/* Primary Action Cards */}
          <div className="grid gap-6 md:grid-cols-2 mb-8">
            {/* Manage Candidates Card */}
            <Link
              href={`/recruiting/companies/${companyId}/jobs/${jobId}/candidates`}
              className="group"
            >
              <Card className="h-full hover:shadow-lg transition-all duration-200 hover:border-primary/50 cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-900/30 transition-colors">
                      <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    {t("actions.reviewCandidates.title")}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {t("actions.reviewCandidates.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t("actions.reviewCandidates.candidateCount", {
                        count: job.company_job_candidates?.[0]?.count || 0,
                      })}
                    </span>
                    <span className="text-primary group-hover:translate-x-1 transition-transform">
                      {t("actions.reviewCandidates.viewAll")}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Setup Interview Process Card */}
            <Link
              href={`/recruiting/companies/${companyId}/jobs/${jobId}/interviews`}
              className="group"
            >
              <Card className="h-full hover:shadow-lg transition-all duration-200 hover:border-primary/50 cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-900/30 transition-colors">
                      <ClipboardList className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    {t("actions.configureInterview.title")}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {t("actions.configureInterview.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {totalInterviewRounds === 0
                        ? t("actions.configureInterview.notConfigured")
                        : t("actions.configureInterview.configured", {
                            count: totalInterviewRounds,
                          })}
                    </span>
                    <span className="text-primary group-hover:translate-x-1 transition-transform">
                      {t("actions.configureInterview.configure")}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Job Description - Collapsible */}
          {job.job_description && (
            <JobDescriptionToggle jobDescription={job.job_description} />
          )}
        </div>
      </div>
    </div>
  );
}
