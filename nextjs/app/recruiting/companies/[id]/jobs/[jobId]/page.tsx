import { redirect, notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { getServerOrigin } from "@/utils/server/common/utils";
import { Logger } from "next-axiom";
import { H1 } from "@/components/typography";
import Link from "next/link";
import { ArrowLeft, Users, FileQuestion } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShareButton } from "@/components/ui/share-button";

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

  // Get the origin from headers
  const origin = await getServerOrigin();

  // Get translations
  const t = await getTranslations("apply.recruiting.jobDetail");

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

  // Fetch job details with counts
  const { data: job, error: jobError } = await supabase
    .from("custom_jobs")
    .select(
      `
      *,
      custom_job_questions (count),
      company_job_candidates (count)
    `
    )
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
            className="hover:text-foreground flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            {company?.name || t("breadcrumb.defaultCompany")}
          </Link>
          <span>/</span>
          <span>{job.job_title}</span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <H1 className="text-2xl sm:text-3xl mb-2">{job.job_title}</H1>
              {job.company_name && (
                <p className="text-muted-foreground mb-4">{job.company_name}</p>
              )}
              <div className="flex gap-2 items-center">
                <Badge
                  variant={job.status === "unlocked" ? "default" : "secondary"}
                >
                  {job.status === "unlocked"
                    ? t("status.published")
                    : t("status.draft")}
                </Badge>
                <ShareButton
                  url={`${origin}/apply/company/${companyId}/job/${jobId}`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Job Description */}
        {job.job_description && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{t("sections.jobDescription.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {job.job_description}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <Link
            href={`/recruiting/companies/${companyId}/jobs/${jobId}/questions`}
          >
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <FileQuestion className="h-8 w-8 text-primary" />
                  <span className="text-2xl font-bold">
                    {job.custom_job_questions?.[0]?.count || 0}
                  </span>
                </div>
                <CardTitle>{t("sections.interviewQuestions.title")}</CardTitle>
                <CardDescription>
                  {t("sections.interviewQuestions.description")}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link
            href={`/recruiting/companies/${companyId}/jobs/${jobId}/candidates`}
          >
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Users className="h-8 w-8 text-primary" />
                  <span className="text-2xl font-bold">
                    {job.company_job_candidates?.[0]?.count || 0}
                  </span>
                </div>
                <CardTitle>{t("sections.candidates.title")}</CardTitle>
                <CardDescription>
                  {t("sections.candidates.description")}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
