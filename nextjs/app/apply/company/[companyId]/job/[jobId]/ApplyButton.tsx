"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Logger } from "next-axiom";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";

interface ApplicationStatusResponse {
  success: boolean;
  hasApplied: boolean;
  hasCompletedInterview: boolean;
  application: {
    id: string;
    status: string;
    applied_at: string;
  } | null;
  interviewId?: string | null;
}

async function checkApplicationStatus(
  companyId: string,
  jobId: string,
  userId: string
): Promise<ApplicationStatusResponse> {
  const supabase = await createSupabaseServerClient();
  const logger = new Logger().with({
    function: "checkApplicationStatus",
    companyId,
    jobId,
    userId,
  });

  // Check if the user has already applied to this job
  const { data: existingCandidate, error: applicationError } = await supabase
    .from("company_job_candidates")
    .select("id, status, applied_at")
    .eq("custom_job_id", jobId)
    .eq("company_id", companyId)
    .eq("candidate_user_id", userId)
    .maybeSingle();

  if (applicationError) {
    logger.error("Database error checking application", {
      error: applicationError,
      companyId,
      jobId,
      userId,
    });
    throw new Error("Failed to check application status");
  }

  const hasApplied = !!existingCandidate;

  // Check if the user has completed an interview for this job
  let hasCompletedInterview = false;
  let interviewId: string | null = null;

  if (existingCandidate) {
    const { data: interviews, error: interviewError } = await supabase
      .from("custom_job_mock_interviews")
      .select("id, status")
      .eq("candidate_id", existingCandidate.id)
      .order("created_at", { ascending: false });

    if (interviewError) {
      logger.error("Database error checking interview completion", {
        error: interviewError,
        candidateId: existingCandidate.id,
        jobId,
        userId,
      });
      throw new Error("Failed to check interview status");
    }

    // Check if any interview is complete
    const completedInterview = interviews?.find(
      (interview) => interview.status === "complete"
    );
    hasCompletedInterview = !!completedInterview;

    // Get the most recent interview ID (completed or in-progress)
    if (interviews && interviews.length > 0) {
      interviewId = interviews[0].id;
    }
  }

  logger.info("Application and interview status checked", {
    companyId,
    jobId,
    userId,
    hasApplied,
    hasCompletedInterview,
    applicationId: existingCandidate?.id,
    interviewId,
  });

  await logger.flush();

  return {
    success: true,
    hasApplied,
    hasCompletedInterview,
    application: existingCandidate || null,
    interviewId,
  };
}

async function handleApplyAction(formData: FormData) {
  "use server";
  const companyId = formData.get("companyId") as string;
  const jobId = formData.get("jobId") as string;
  const userId = formData.get("userId") as string;

  if (!companyId || !jobId || !userId) {
    throw new Error("Missing required parameters");
  }

  const result = await checkApplicationStatus(companyId, jobId, userId);

  if (result.hasApplied) {
    if (result.hasCompletedInterview) {
      // User has already applied and completed interview, redirect to submitted page
      redirect(
        `/apply/company/${companyId}/job/${jobId}/application/submitted`
      );
    } else if (result.interviewId) {
      // User has applied and has an interview ID, redirect to specific interview page
      redirect(
        `/apply/company/${companyId}/job/${jobId}/interview/${result.interviewId}`
      );
    } else {
      // User has applied but no interview exists (shouldn't happen in normal flow)
      redirect(`/apply/company/${companyId}/job/${jobId}/interview`);
    }
  } else {
    // User hasn't applied yet, redirect to application page
    redirect(`/apply/company/${companyId}/job/${jobId}/application`);
  }
}

export default async function ApplyButton({
  companyId,
  jobId,
  userId,
}: {
  companyId: string;
  jobId: string;
  userId: string;
}) {
  const t = await getTranslations("apply");

  return (
    <form action={handleApplyAction}>
      <input type="hidden" name="companyId" value={companyId} />
      <input type="hidden" name="jobId" value={jobId} />
      <input type="hidden" name="userId" value={userId} />
      <Button type="submit" size="lg" className="w-full sm:w-auto">
        {t("jobPage.buttons.applyNow")}
      </Button>
    </form>
  );
}
