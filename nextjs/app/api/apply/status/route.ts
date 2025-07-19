import { createSupabaseServerClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { AxiomRequest, withAxiom } from "next-axiom";

export const POST = withAxiom(async (request: AxiomRequest) => {
  const logger = request.log.with({
    method: request.method,
    path: "/api/apply/status",
  });

  try {
    const supabase = await createSupabaseServerClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.error("Authentication failed", { authError });
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const { companyId, jobId } = (await request.json()) as {
      companyId: string;
      jobId: string;
    };

    if (!companyId || !jobId) {
      logger.error("Missing required parameters", { companyId, jobId });
      return NextResponse.json(
        { success: false, error: "Company ID and Job ID are required" },
        { status: 400 }
      );
    }

    // Check if the user has already applied to this job
    const { data: existingCandidate, error: applicationError } = await supabase
      .from("company_job_candidates")
      .select("id, status, applied_at")
      .eq("custom_job_id", jobId)
      .eq("company_id", companyId)
      .eq("candidate_user_id", user.id)
      .maybeSingle();

    if (applicationError && applicationError.code !== "PGRST116") {
      // PGRST116 is "no rows returned", which is expected if no application exists
      logger.error("Database error checking application", {
        error: applicationError,
        companyId,
        jobId,
        userId: user.id,
      });
      return NextResponse.json(
        { success: false, error: "Failed to check application status" },
        { status: 500 }
      );
    }

    const hasApplied = !!existingCandidate;

    // Check if the user has completed an interview for this job
    let hasCompletedInterview = false;
    if (existingCandidate) {
      const { data: completedInterview, error: interviewError } = await supabase
        .from("custom_job_mock_interviews")
        .select("id, status")
        .eq("candidate_id", existingCandidate.id)
        .eq("status", "complete")
        .maybeSingle();

      if (interviewError) {
        logger.error("Database error checking interview completion", {
          error: interviewError,
          candidateId: existingCandidate.id,
          jobId,
          userId: user.id,
        });
        return NextResponse.json(
          { success: false, error: "Failed to check interview status" },
          { status: 500 }
        );
      }

      hasCompletedInterview = !!completedInterview;
    }

    logger.info("Application and interview status checked", {
      companyId,
      jobId,
      userId: user.id,
      hasApplied,
      hasCompletedInterview,
      applicationId: existingCandidate?.id,
    });

    return NextResponse.json({
      success: true,
      hasApplied,
      hasCompletedInterview,
      application: existingCandidate || null,
    });
  } catch (error) {
    logger.error("Unexpected error in application status check", { error });
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});
