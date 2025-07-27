import { createSupabaseServerClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Logger } from "next-axiom";
import { ApplicationForm } from "./ApplicationForm";
import { C } from "@upstash/redis/zmscore-DzNHSWxc";
import { Tables } from "@/utils/supabase/database.types";

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

  // Get user if logged in (may be anonymous)
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  // Check if user has already applied (only if user is authenticated)
  let existingApplication: Pick<Tables<"company_job_candidates">, "id"> | null =
    null;
  let userFiles: Tables<"user_files">[] = [];

  if (user) {
    const { data } = await supabase
      .from("company_job_candidates")
      .select("id")
      .eq("custom_job_id", jobId)
      .eq("candidate_user_id", user.id)
      .single();

    existingApplication = data;

    if (existingApplication) {
      // Check if there's a completed mock interview for this application
      const { data: interview } = await supabase
        .from("custom_job_mock_interviews")
        .select("id, status")
        .eq("custom_job_id", jobId)
        .eq("candidate_id", existingApplication.id)
        .single();

      if (interview) {
        if (interview.status === "complete") {
          // If there's a completed interview, redirect to submitted page
          redirect(
            `/apply/company/${companyId}/job/${jobId}/application/submitted`
          );
        } else {
          redirect(
            `/apply/company/${companyId}/job/${jobId}/interview/${interview.id}`
          );
        }
      }
      throw new Error("No interview found for job application");
    }

    // Fetch user's existing files
    const { data: files, error: filesError } = await supabase
      .from("user_files")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (filesError) {
      logger.error("Error fetching user files", { error: filesError });
    } else {
      userFiles = files || [];
    }
  }

  return (
    <ApplicationForm
      company={company}
      job={job}
      user={user}
      userFiles={userFiles}
      companyId={companyId}
      jobId={jobId}
    />
  );
}
