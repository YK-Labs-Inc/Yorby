"use server";

import { createAdminClient } from "@/utils/supabase/server";
import { Logger } from "next-axiom";

export async function markCandidateOnboardingComplete() {
  const log = new Logger().with({
    function: "markCandidateOnboardingComplete",
  });

  try {
    const supabase = await createAdminClient();

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      log.error("Failed to get current user", {
        error: userError?.message,
      });
      return { success: false, error: "User not authenticated" };
    }

    // Update the user's app_metadata to mark onboarding as complete
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      {
        app_metadata: {
          ...user.app_metadata,
          completed_candidate_onboarding: true,
        },
      }
    );

    if (updateError) {
      log.error("Failed to update user app_metadata", {
        userId: user.id,
        error: updateError.message,
      });
      return { success: false, error: "Failed to update user metadata" };
    }

    log.info("Successfully marked candidate onboarding as complete", {
      userId: user.id,
    });

    return { success: true };
  } catch (error) {
    log.error("Unexpected error in markCandidateOnboardingComplete", {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  } finally {
    await log.flush();
  }
}
