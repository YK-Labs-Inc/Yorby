import { createSupabaseServerClient } from "@/utils/supabase/server";
import { getServerUser } from "@/utils/auth/server";
import { notFound, redirect } from "next/navigation";
import { Logger } from "next-axiom";
import { ApplicationForm } from "./ApplicationForm";
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
  const user = await getServerUser();

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
      // Fetch the job interviews for the job
      const { data: jobInterviews, error: jobInterviewsError } = await supabase
        .from("job_interviews")
        .select("id, order_index")
        .eq("custom_job_id", jobId)
        .order("order_index", { ascending: true });

      if (jobInterviewsError) {
        logger.error("Error fetching job interviews", {
          error: jobInterviewsError,
        });
        return notFound();
      }

      // Check if the current candidate has completed the job interviews or not
      let { data: interviews } = await supabase
        .from("candidate_job_interviews")
        .select("id, interview_id, status")
        .in(
          "interview_id",
          jobInterviews.map((interview) => interview.id)
        )
        .eq("candidate_id", existingApplication.id);

      if (interviews) {
        interviews = interviews.sort(
          (a, b) =>
            (jobInterviews.find((interview) => interview.id === a.interview_id)
              ?.order_index || 0) -
            (jobInterviews.find((interview) => interview.id === b.interview_id)
              ?.order_index || 0)
        );
        if (interviews.every((interview) => interview.status === "completed")) {
          // If all interviews are completed, redirect to submitted page
          redirect(
            `/apply/company/${companyId}/job/${jobId}/application/submitted`
          );
        } else {
          const lastIncompleteInterview = interviews.find(
            (interview) => interview.status !== "completed"
          );
          if (lastIncompleteInterview) {
            redirect(
              `/apply/company/${companyId}/job/${jobId}/application/confirm-email?interviewId=${lastIncompleteInterview.id}`
            );
          }
          logger.error("No incomplete interview found for job application");
          await logger.flush();
          notFound();
        }
      }
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
