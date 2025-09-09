import { createSupabaseServerClient } from "@/utils/supabase/server";
import { getServerUser } from "@/utils/auth/server";
import { notFound, redirect } from "next/navigation";
import { Logger } from "next-axiom";
import { getTranslations } from "next-intl/server";
import EmailVerificationComponent from "./EmailVerificationComponent";

interface PageProps {
  params: Promise<{
    companyId: string;
    jobId: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ConfirmEmailPage({
  params,
  searchParams,
}: PageProps) {
  const { companyId, jobId } = await params;
  const { interviewId } = (await searchParams) as { interviewId: string };
  if (!companyId || !jobId || !interviewId) {
    return notFound();
  }

  const supabase = await createSupabaseServerClient();
  const logger = new Logger().with({
    function: "ConfirmEmailPage",
    companyId,
    jobId,
    interviewId,
  });

  // Get the current user
  const user = await getServerUser();

  if (!user) {
    logger.error("No user found on confirm email page");
    redirect(`/apply/company/${companyId}/job/${jobId}`);
  }

  // Fetch company info
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("*")
    .eq("id", companyId)
    .single();

  if (companyError || !company) {
    logger.error("Company not found", { companyId });
    redirect(`/apply/company/${companyId}/job/${jobId}`);
  }

  // Fetch job info
  const { data: job, error: jobError } = await supabase
    .from("custom_jobs")
    .select("*")
    .eq("id", jobId)
    .eq("company_id", companyId)
    .single();

  if (jobError || !job) {
    logger.error("Job not found", { jobId });
    redirect(`/apply/company/${companyId}/job/${jobId}`);
  }

  await logger.flush();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <EmailVerificationComponent
          companyName={company.name}
          jobTitle={job.job_title}
          interviewId={interviewId}
          companyId={companyId}
          jobId={jobId}
          user={user}
        />
      </div>
    </div>
  );
}
