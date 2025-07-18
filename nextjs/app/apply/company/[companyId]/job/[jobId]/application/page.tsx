import { createSupabaseServerClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Logger } from "next-axiom";
import { ApplicationForm } from "./ApplicationForm";

interface PageProps {
  params: Promise<{
    companyId: string;
    jobId: string;
  }>;
}

export default async function ApplicationPage({ params }: PageProps) {
  const { companyId, jobId } = await params;
  const supabase = await createSupabaseServerClient();
  const logger = new Logger().with({
    function: "ApplicationPage",
    companyId,
    jobId,
  });

  // Check if user is logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?redirect=/apply/company/${companyId}/job/${jobId}/application`);
  }

  // Fetch company info
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("*")
    .eq("id", companyId)
    .single();

  if (companyError || !company) {
    logger.error("Company not found", { companyId });
    redirect("/");
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
    redirect("/");
  }

  // Check if user has already applied
  const { data: existingApplication } = await supabase
    .from("company_job_candidates")
    .select("id")
    .eq("custom_job_id", jobId)
    .eq("candidate_user_id", user.id)
    .single();

  if (existingApplication) {
    redirect(`/apply/company/${companyId}/job/${jobId}/application/submitted`);
  }

  // Fetch user's existing files
  const { data: userFiles, error: filesError } = await supabase
    .from("user_files")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (filesError) {
    logger.error("Error fetching user files", { error: filesError });
  }

  return (
    <ApplicationForm
      company={company}
      job={job}
      user={user}
      userFiles={userFiles || []}
      companyId={companyId}
      jobId={jobId}
    />
  );
}