"use server";

import { createSupabaseServerClient } from "@/utils/supabase/server";
import { getServerUser } from "@/utils/auth/server";
import { revalidatePath } from "next/cache";
import { Logger } from "next-axiom";
import { Database } from "@/utils/supabase/database.types";

type InterviewType = Database["public"]["Enums"]["job_interview_type"];
type InterviewWeight = Database["public"]["Enums"]["interview_weight"];

export async function createJobInterview(
  prevState: { success?: boolean; error?: string },
  formData: FormData
) {
  const name = formData.get("name") as string;
  const interview_type = formData.get("interview_type") as InterviewType;
  const weight = formData.get("weight") as InterviewWeight;
  const custom_job_id = formData.get("custom_job_id") as string;
  const order_index = Number(formData.get("order_index"));

  const logger = new Logger().with({
    function: "createJobInterview",
    name,
    interview_type,
    weight,
    custom_job_id,
    order_index,
  });

  try {
    const supabase = await createSupabaseServerClient();

    // Get the current user
    const user = await getServerUser();

    if (!user) {
      throw new Error("Not authenticated");
    }

    // Check if the job exists and user has access
    const { data: job, error: jobError } = await supabase
      .from("custom_jobs")
      .select("*, companies(*)")
      .eq("id", custom_job_id)
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
        name,
        interview_type,
        weight,
        custom_job_id,
        order_index,
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
      `/recruiting/companies/${job.company_id}/jobs/${custom_job_id}/interviews`
    );

    return { success: true };
  } catch (error: any) {
    logger.error("Error in createJobInterview", { error });
    await logger.flush();
    return { success: false, error: error.message };
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
    const user = await getServerUser();

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
    const tempErrors = tempResults.filter((r) => r.error);

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
    const finalErrors = finalResults.filter((r) => r.error);

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

export async function updateJobInterview(
  prevState: { success?: boolean; error?: string },
  formData: FormData
) {
  const interviewId = formData.get("interview_id") as string;
  const name = formData.get("name") as string;
  const interview_type = formData.get("interview_type") as InterviewType;
  const weight = formData.get("weight") as InterviewWeight;
  const custom_job_id = formData.get("custom_job_id") as string;

  const logger = new Logger().with({
    function: "updateJobInterview",
    interviewId,
    name,
    interview_type,
    weight,
    custom_job_id,
  });

  try {
    const supabase = await createSupabaseServerClient();

    // Get the current user
    const user = await getServerUser();

    if (!user) {
      throw new Error("Not authenticated");
    }

    // Check if the job exists and user has access
    const { data: job, error: jobError } = await supabase
      .from("custom_jobs")
      .select("*, companies(*)")
      .eq("id", custom_job_id)
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

    // Update the interview round
    const { data, error: updateError } = await supabase
      .from("job_interviews")
      .update({
        name,
        interview_type,
        weight,
      })
      .eq("id", interviewId)
      .eq("custom_job_id", custom_job_id);

    if (updateError) {
      logger.error("Failed to update interview", { error: updateError });
      await logger.flush();
      throw new Error("Failed to update interview round");
    }

    logger.info("Interview round updated successfully");
    await logger.flush();

    // Revalidate the page to show the updated interview
    revalidatePath(
      `/recruiting/companies/${job.company_id}/jobs/${custom_job_id}/interviews`
    );

    return { success: true };
  } catch (error: any) {
    logger.error("Error in updateJobInterview", { error });
    await logger.flush();
    return { success: false, error: error.message };
  }
}

export async function deleteJobInterview(
  prevState: { success?: boolean; error?: string },
  formData: FormData
) {
  const interviewId = formData.get("interview_id") as string;
  const jobId = formData.get("custom_job_id") as string;

  const logger = new Logger().with({
    function: "deleteJobInterview",
    interviewId,
    jobId,
  });

  try {
    const supabase = await createSupabaseServerClient();

    // Get the current user
    const user = await getServerUser();

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

    // Delete the interview round
    const { error: deleteError } = await supabase
      .from("job_interviews")
      .delete()
      .eq("id", interviewId)
      .eq("custom_job_id", jobId);

    if (deleteError) {
      logger.error("Failed to delete interview", { error: deleteError });
      await logger.flush();
      throw new Error("Failed to delete interview round");
    }

    logger.info("Interview round deleted successfully", { interviewId });
    await logger.flush();

    // Revalidate the page to show the updated list
    revalidatePath(
      `/recruiting/companies/${job.company_id}/jobs/${jobId}/interviews`
    );

    return { success: true };
  } catch (error: any) {
    logger.error("Error in deleteJobInterview", { error });
    await logger.flush();
    return { success: false, error: error.message };
  }
}
