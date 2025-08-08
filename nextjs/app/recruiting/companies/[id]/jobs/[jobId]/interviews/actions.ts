"use server";

import { createSupabaseServerClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { Logger } from "next-axiom";
import { Database } from "@/utils/supabase/database.types";

type InterviewType = Database["public"]["Enums"]["job_interview_type"];

interface CreateJobInterviewData {
  name: string;
  interview_type: InterviewType;
  custom_job_id: string;
  order_index: number;
}

export async function createJobInterview(data: CreateJobInterviewData) {
  const logger = new Logger().with({
    function: "createJobInterview",
    data,
  });

  try {
    const supabase = await createSupabaseServerClient();

    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Not authenticated");
    }

    // Check if the job exists and user has access
    const { data: job, error: jobError } = await supabase
      .from("custom_jobs")
      .select("*, companies(*)")
      .eq("id", data.custom_job_id)
      .single();

    if (jobError || !job) {
      logger.error("Job not found", { error: jobError });
      await logger.flush();
      throw new Error("Job not found");
    }

    // Check if user is a member of the company
    if (job.company_id) {
      const { data: membership, error: memberError } = await supabase
        .from("company_members")
        .select("*")
        .eq("company_id", job.company_id)
        .eq("user_id", user.id)
        .in("role", ["owner", "admin", "recruiter"])
        .single();

      if (memberError || !membership) {
        logger.error("User is not authorized to manage this job", {
          error: memberError,
        });
        await logger.flush();
        throw new Error("Not authorized to manage this job");
      }
    }

    // Create the interview round
    const { data: interview, error: createError } = await supabase
      .from("job_interviews")
      .insert({
        name: data.name,
        interview_type: data.interview_type,
        custom_job_id: data.custom_job_id,
        order_index: data.order_index,
      })
      .select()
      .single();

    if (createError) {
      logger.error("Failed to create interview", { error: createError });
      await logger.flush();
      throw new Error("Failed to create interview round");
    }

    logger.info("Interview round created successfully", { interview });
    await logger.flush();

    // Revalidate the page to show the new interview
    revalidatePath(
      `/recruiting/companies/${job.company_id}/jobs/${data.custom_job_id}/interviews`
    );

    return { data: interview };
  } catch (error: any) {
    logger.error("Error in createJobInterview", { error });
    await logger.flush();
    return { error: error.message };
  }
}

export async function updateInterviewOrder(
  jobId: string,
  interviewIds: string[]
) {
  const logger = new Logger().with({
    function: "updateInterviewOrder",
    jobId,
    interviewIds,
  });

  try {
    const supabase = await createSupabaseServerClient();

    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Not authenticated");
    }

    // Check if the job exists and user has access
    const { data: job, error: jobError } = await supabase
      .from("custom_jobs")
      .select("*, companies(*)")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      logger.error("Job not found", { error: jobError });
      await logger.flush();
      throw new Error("Job not found");
    }

    // Check if user is a member of the company
    if (job.company_id) {
      const { data: membership, error: memberError } = await supabase
        .from("company_members")
        .select("*")
        .eq("company_id", job.company_id)
        .eq("user_id", user.id)
        .in("role", ["owner", "admin", "recruiter"])
        .single();

      if (memberError || !membership) {
        logger.error("User is not authorized to manage this job", {
          error: memberError,
        });
        await logger.flush();
        throw new Error("Not authorized to manage this job");
      }
    }

    // To avoid unique constraint violations, we use a two-phase update:
    // 1. Move all items to high temporary values (starting at 10000)
    // 2. Move them back to their final positions
    
    // Phase 1: Move to temporary positions
    const tempUpdatePromises = interviewIds.map((interviewId, index) =>
      supabase
        .from("job_interviews")
        .update({ order_index: 10000 + index })
        .eq("id", interviewId)
        .eq("custom_job_id", jobId)
    );

    const tempResults = await Promise.all(tempUpdatePromises);
    const tempErrors = tempResults.filter(r => r.error);
    
    if (tempErrors.length > 0) {
      logger.error("Failed to set temporary order", { errors: tempErrors });
      await logger.flush();
      throw new Error("Failed to update interview order");
    }

    // Phase 2: Move to final positions
    const finalUpdatePromises = interviewIds.map((interviewId, index) =>
      supabase
        .from("job_interviews")
        .update({ order_index: index })
        .eq("id", interviewId)
        .eq("custom_job_id", jobId)
    );

    const finalResults = await Promise.all(finalUpdatePromises);
    const finalErrors = finalResults.filter(r => r.error);
    
    if (finalErrors.length > 0) {
      logger.error("Failed to set final order", { errors: finalErrors });
      await logger.flush();
      throw new Error("Failed to update interview order");
    }

    logger.info("Interview order updated successfully", { interviewIds });
    await logger.flush();

    // Revalidate the page to show the new order
    revalidatePath(
      `/recruiting/companies/${job.company_id}/jobs/${jobId}/interviews`
    );

    return { success: true };
  } catch (error: any) {
    logger.error("Error in updateInterviewOrder", { error });
    await logger.flush();
    return { error: error.message };
  }
}
