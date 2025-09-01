import { createSupabaseServerClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { AxiomRequest, withAxiom } from "next-axiom";
import { getServerUser } from "@/utils/auth/server";

// GET /api/jobs - List jobs
export const GET = withAxiom(async (request: AxiomRequest) => {
  const logger = request.log.with({
    method: request.method,
    path: "/api/jobs",
  });

  try {
    const supabase = await createSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const companyId = searchParams.get("companyId");

    // Check if user is authenticated
    const user = await getServerUser();

    if (!user) {
      logger.error("Authentication failed");
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Build query
    let query = supabase
      .from("custom_jobs")
      .select("*")
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false });

    // Filter by company if specified
    if (companyId) {
      query = query.eq("company_id", companyId);
    }

    const { data: jobs, error: jobsError } = await query;

    if (jobsError) {
      logger.error("Database error fetching jobs", { jobsError });
      return NextResponse.json(
        { success: false, error: "Failed to fetch jobs" },
        { status: 500 }
      );
    }

    logger.info("Jobs fetched successfully", {
      count: jobs.length,
      userId: user.id,
      companyId,
    });

    return NextResponse.json({
      success: true,
      data: jobs,
    });
  } catch (error) {
    logger.error("Unexpected error in jobs GET", { error });
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});

// POST /api/jobs - Create a new job
export const POST = withAxiom(async (request: AxiomRequest) => {
  const logger = request.log.with({
    method: request.method,
    path: "/api/jobs",
  });

  try {
    const supabase = await createSupabaseServerClient();

    // Check if user is authenticated
    const user = await getServerUser();

    if (!user) {
      logger.error("Authentication failed");
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { job_title, job_description, company_id, coach_id } = body;

    if (!job_title) {
      logger.error("Missing required fields", { job_title });
      return NextResponse.json(
        { success: false, error: "Job title is required" },
        { status: 400 }
      );
    }

    // Create the job
    const { data: job, error: jobError } = await supabase
      .from("custom_jobs")
      .insert({
        job_title,
        job_description,
        company_id,
        coach_id,
        user_id: user.id,
        status: "unlocked", // Use the status field instead of deletion_status
      })
      .select()
      .single();

    if (jobError) {
      logger.error("Database error creating job", { jobError });
      return NextResponse.json(
        { success: false, error: "Failed to create job" },
        { status: 500 }
      );
    }

    logger.info("Job created successfully", {
      jobId: job.id,
      userId: user.id,
      companyId: company_id,
    });

    return NextResponse.json({
      success: true,
      data: job,
    });
  } catch (error) {
    logger.error("Unexpected error in jobs POST", { error });
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});
