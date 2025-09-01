import { redirect, notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { getServerUser } from "@/utils/auth/server";
import { Logger } from "next-axiom";
import { H1 } from "@/components/typography";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Suspense } from "react";
import QuestionsTable from "./QuestionsTable";
import { Tables } from "@/utils/supabase/database.types";
import QuestionsTableLoading from "./QuestionsTableLoading";
import { getTranslations } from "next-intl/server";

export type InterviewQuestion = Tables<"job_interview_questions"> & {
  company_interview_question_bank: Tables<"company_interview_question_bank"> & {
    company_interview_coding_question_metadata?: Tables<"company_interview_coding_question_metadata"> | null;
  };
};

async function fetchQuestions(
  interviewId: string
): Promise<InterviewQuestion[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("job_interview_questions")
    .select(
      `
      *,
      company_interview_question_bank(
        *,
        company_interview_coding_question_metadata(*)
      )
    `
    )
    .eq("interview_id", interviewId)
    .order("order_index", { ascending: true });

  if (error) throw error;
  return data;
}

interface PageProps {
  params: Promise<{
    id: string;
    jobId: string;
    interviewId: string;
  }>;
}

export default async function QuestionsPage({ params }: PageProps) {
  const { id: companyId, jobId, interviewId } = await params;
  const supabase = await createSupabaseServerClient();
  const logger = new Logger().with({
    function: "QuestionsPage",
    params: { companyId, jobId },
  });

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

  const t = await getTranslations("apply.recruiting.jobDetail");

  // Get company details for breadcrumb
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("name")
    .eq("id", companyId)
    .single();

  if (companyError || !company) {
    logger.error("Company not found", { error: companyError });
    await logger.flush();
    notFound();
  }

  const { data: interview, error: interviewError } = await supabase
    .from("job_interviews")
    .select("*")
    .eq("id", interviewId)
    .single();

  if (interviewError || !interview) {
    logger.error("Interview not found", { error: interviewError });
    await logger.flush();
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link
            href={`/recruiting/companies/${companyId}`}
            className="hover:text-foreground flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            {company?.name || t("breadcrumb.defaultCompany")}
          </Link>
          <span>/</span>
          <Link
            href={`/recruiting/companies/${companyId}/jobs/${jobId}`}
            className="hover:text-foreground flex items-center gap-1"
          >
            {job.job_title || t("breadcrumb.defaultJob")}
          </Link>
          <span>/</span>
          <Link
            href={`/recruiting/companies/${companyId}/jobs/${jobId}/interviews`}
            className="hover:text-foreground flex items-center gap-1"
          >
            {t("sections.interviewRounds.title")}
          </Link>
          <span>/</span>
          <span>{interview.name}</span>
        </div>

        <Suspense fallback={<QuestionsTableLoading />}>
          <QuestionsTableWrapper
            jobId={jobId}
            jobTitle={job.job_title}
            companyId={companyId}
            interview={interview}
          />
        </Suspense>
      </div>
    </div>
  );
}

async function QuestionsTableWrapper({
  jobId,
  jobTitle,
  companyId,
  interview,
}: {
  jobId: string;
  jobTitle: string;
  companyId: string;
  interview: Tables<"job_interviews">;
}) {
  const questions = await fetchQuestions(interview.id);

  return (
    <QuestionsTable
      interview={interview}
      jobId={jobId}
      jobTitle={jobTitle}
      companyId={companyId}
      questions={questions}
    />
  );
}
