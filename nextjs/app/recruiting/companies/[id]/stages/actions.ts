"use server";

import {
  createSupabaseServerClient,
} from "@/utils/supabase/server";
import { getServerUser } from "@/utils/auth/server";
import { redirect } from "next/navigation";
import { Tables } from "@/utils/supabase/database.types";
import { Logger } from "next-axiom";
import { revalidatePath } from "next/cache";

export type ApplicationStage = Tables<"company_application_stages">;

export interface StageFormData {
  id?: string;
  name: string;
  description: string;
  color: string;
  order_index: number;
}

export interface StageUpdateData extends StageFormData {
  id: string;
}

// Validate user access to company
async function validateCompanyAccess(companyId: string) {
  const supabase = await createSupabaseServerClient();
  const user = await getServerUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Check if user is a member of this company
  const { data: membership, error: memberError } = await supabase
    .from("company_members")
    .select("role")
    .eq("company_id", companyId)
    .eq("user_id", user.id)
    .single();

  if (memberError || !membership) {
    throw new Error("Access denied");
  }

  return { supabase, user, membership };
}

// Get stages for a company
export async function getCompanyStages(companyId: string): Promise<ApplicationStage[]> {
  const { supabase } = await validateCompanyAccess(companyId);
  const logger = new Logger().with({
    function: "getCompanyStages",
    params: { companyId },
  });

  const { data, error } = await supabase
    .from("company_application_stages")
    .select("*")
    .eq("company_id", companyId)
    .order("order_index", { ascending: true });

  if (error) {
    logger.error("Error fetching company stages", { error });
    await logger.flush();
    throw new Error("Failed to fetch stages");
  }

  return data || [];
}

// Create a new stage
export async function createStage(companyId: string, stageData: Omit<StageFormData, "id">): Promise<ApplicationStage> {
  const { supabase } = await validateCompanyAccess(companyId);
  const logger = new Logger().with({
    function: "createStage",
    params: { companyId, stageData },
  });

  const { data, error } = await supabase
    .from("company_application_stages")
    .insert({
      company_id: companyId,
      name: stageData.name,
      description: stageData.description,
      color: stageData.color,
      order_index: stageData.order_index,
    })
    .select()
    .single();

  if (error) {
    logger.error("Error creating stage", { error });
    await logger.flush();
    throw new Error("Failed to create stage");
  }

  revalidatePath(`/recruiting/companies/${companyId}/stages`);
  return data;
}

// Update an existing stage
export async function updateStage(companyId: string, stageData: StageUpdateData): Promise<ApplicationStage> {
  const { supabase } = await validateCompanyAccess(companyId);
  const logger = new Logger().with({
    function: "updateStage",
    params: { companyId, stageData },
  });

  const { data, error } = await supabase
    .from("company_application_stages")
    .update({
      name: stageData.name,
      description: stageData.description,
      color: stageData.color,
      order_index: stageData.order_index,
    })
    .eq("id", stageData.id)
    .eq("company_id", companyId)
    .select()
    .single();

  if (error) {
    logger.error("Error updating stage", { error });
    await logger.flush();
    throw new Error("Failed to update stage");
  }

  revalidatePath(`/recruiting/companies/${companyId}/stages`);
  return data;
}

// Delete a stage with optional candidate reassignment
export async function deleteStage(
  companyId: string, 
  stageId: string, 
  reassignToStageId?: string | null
): Promise<void> {
  const { supabase } = await validateCompanyAccess(companyId);
  const logger = new Logger().with({
    function: "deleteStage",
    params: { companyId, stageId, reassignToStageId },
  });

  // Check if this is the last stage and set reassignment to null if needed
  const { count: totalStages, error: countError } = await supabase
    .from("company_application_stages")
    .select("*", { count: "exact", head: true })
    .eq("company_id", companyId);

  if (countError) {
    logger.error("Error counting stages", { error: countError });
    await logger.flush();
    throw new Error("Failed to check stage count");
  }

  // If this is the last stage, automatically reassign candidates to null (no stage)
  if (totalStages && totalStages <= 1 && reassignToStageId === undefined) {
    reassignToStageId = null;
  }

  // Check if any candidates are assigned to this stage
  const { data: candidatesWithStage, error: candidateCheckError } = await supabase
    .from("company_job_candidates")
    .select("id")
    .eq("current_stage_id", stageId);

  if (candidateCheckError) {
    logger.error("Error checking candidates for stage", { error: candidateCheckError });
    await logger.flush();
    throw new Error("Failed to check candidates");
  }

  // If there are candidates and no reassignment stage provided, throw error
  if (candidatesWithStage && candidatesWithStage.length > 0 && reassignToStageId === undefined) {
    throw new Error("Cannot delete stage with assigned candidates without specifying reassignment");
  }

  // If there are candidates, reassign them
  if (candidatesWithStage && candidatesWithStage.length > 0) {
    const { error: reassignError } = await supabase
      .from("company_job_candidates")
      .update({ current_stage_id: reassignToStageId })
      .eq("current_stage_id", stageId);

    if (reassignError) {
      logger.error("Error reassigning candidates", { error: reassignError });
      await logger.flush();
      throw new Error("Failed to reassign candidates");
    }
  }

  // Delete the stage
  const { error } = await supabase
    .from("company_application_stages")
    .delete()
    .eq("id", stageId)
    .eq("company_id", companyId);

  if (error) {
    logger.error("Error deleting stage", { error });
    await logger.flush();
    throw new Error("Failed to delete stage");
  }

  revalidatePath(`/recruiting/companies/${companyId}/stages`);
}

// Get count of candidates assigned to a stage
export async function getStageCandidateCount(stageId: string): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const logger = new Logger().with({
    function: "getStageCandidateCount",
    params: { stageId },
  });

  const { count, error } = await supabase
    .from("company_job_candidates")
    .select("*", { count: "exact", head: true })
    .eq("current_stage_id", stageId);

  if (error) {
    logger.error("Error getting stage candidate count", { error });
    await logger.flush();
    return 0;
  }

  return count || 0;
}

// Update multiple stage orders
export async function updateStageOrders(
  companyId: string, 
  stageUpdates: Array<{ id: string; order_index: number }>
): Promise<void> {
  const { supabase } = await validateCompanyAccess(companyId);
  const logger = new Logger().with({
    function: "updateStageOrders",
    params: { companyId, stageUpdates },
  });

  // Update each stage's order_index
  for (const update of stageUpdates) {
    const { error } = await supabase
      .from("company_application_stages")
      .update({ order_index: update.order_index })
      .eq("id", update.id)
      .eq("company_id", companyId);

    if (error) {
      logger.error("Error updating stage order", { error, stageId: update.id });
      await logger.flush();
      throw new Error("Failed to update stage order");
    }
  }

  revalidatePath(`/recruiting/companies/${companyId}/stages`);
}