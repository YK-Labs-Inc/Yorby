import { createSupabaseServerClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { Logger } from "next-axiom";

interface RouteContext {
  params: Promise<{
    jobId: string;
  }>;
}

// GET /api/jobs/[jobId] - Get a specific job
export async function GET(request: NextRequest, context: RouteContext) {
  const logger = new Logger().with({ endpoint: "/api/jobs/[jobId]", method: "GET" });
  
  try {
    const { jobId } = await context.params;
    const supabase = await createSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    if (!jobId) {
      logger.error("Missing jobId parameter");
      return NextResponse.json(
        { success: false, error: "Job ID is required" },
        { status: 400 }
      );
    }

    // Build query - no deletion_status column exists in custom_jobs table
    let query = supabase
      .from("custom_jobs")
      .select("*")
      .eq("id", jobId);

    // Filter by company if specified
    if (companyId) {
      query = query.eq("company_id", companyId);
    }

    const { data: job, error: jobError } = await query.single();

    if (jobError) {
      if (jobError.code === "PGRST116") {
        logger.info("Job not found", { jobId, companyId });
        return NextResponse.json(
          { success: false, error: "Job not found" },
          { status: 404 }
        );
      }
      
      logger.error("Database error fetching job", { jobError, jobId });
      return NextResponse.json(
        { success: false, error: "Failed to fetch job" },
        { status: 500 }
      );
    }

    logger.info("Job fetched successfully", { jobId, companyId });

    return NextResponse.json({
      success: true,
      data: job,
    });

  } catch (error) {
    logger.error("Unexpected error in job GET", { error });
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/jobs/[jobId] - Update a job
export async function PUT(request: NextRequest, context: RouteContext) {
  const logger = new Logger().with({ endpoint: "/api/jobs/[jobId]", method: "PUT" });
  
  try {
    const { jobId } = await context.params;
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

    if (!jobId) {
      logger.error("Missing jobId parameter");
      return NextResponse.json(
        { success: false, error: "Job ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { 
      job_title, 
      job_description, 
      company_id, 
      coach_id
    } = body;

    // Update the job
    const { data: job, error: jobError } = await supabase
      .from("custom_jobs")
      .update({
        job_title,
        job_description,
        company_id,
        coach_id
      })
      .eq("id", jobId)
      .select()
      .single();

    if (jobError) {
      if (jobError.code === "PGRST116") {
        logger.info("Job not found for update", { jobId });
        return NextResponse.json(
          { success: false, error: "Job not found" },
          { status: 404 }
        );
      }
      
      logger.error("Database error updating job", { jobError, jobId });
      return NextResponse.json(
        { success: false, error: "Failed to update job" },
        { status: 500 }
      );
    }

    logger.info("Job updated successfully", { 
      jobId,
      userId: user.id 
    });

    return NextResponse.json({
      success: true,
      data: job,
    });

  } catch (error) {
    logger.error("Unexpected error in job PUT", { error });
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/jobs/[jobId] - Delete a job (soft delete)
export async function DELETE(request: NextRequest, context: RouteContext) {
  const logger = new Logger().with({ endpoint: "/api/jobs/[jobId]", method: "DELETE" });
  
  try {
    const { jobId } = await context.params;
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

    if (!jobId) {
      logger.error("Missing jobId parameter");
      return NextResponse.json(
        { success: false, error: "Job ID is required" },
        { status: 400 }
      );
    }

    // Hard delete the job since no deletion_status column exists
    const { data: job, error: jobError } = await supabase
      .from("custom_jobs")
      .delete()
      .eq("id", jobId)
      .select()
      .single();

    if (jobError) {
      if (jobError.code === "PGRST116") {
        logger.info("Job not found for deletion", { jobId });
        return NextResponse.json(
          { success: false, error: "Job not found" },
          { status: 404 }
        );
      }
      
      logger.error("Database error deleting job", { jobError, jobId });
      return NextResponse.json(
        { success: false, error: "Failed to delete job" },
        { status: 500 }
      );
    }

    logger.info("Job deleted successfully", { 
      jobId,
      userId: user.id 
    });

    return NextResponse.json({
      success: true,
      message: "Job deleted successfully",
      data: job,
    });

  } catch (error) {
    logger.error("Unexpected error in job DELETE", { error });
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}