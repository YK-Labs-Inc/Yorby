"use server";

import { createAdminClient } from "@/utils/supabase/server";
import { Logger } from "next-axiom";

export async function completeOnboarding() {
  const supabase = await createAdminClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  const logger = new Logger().with({
    userId: user?.id,
    function: "completeOnboarding",
  });

  if (userError || !user) {
    logger.error("Error fetching user:", { error: userError?.message });
    await logger.flush();
    return { error: "User not found or error fetching user." };
  }

  const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
    app_metadata: {
      ...user.app_metadata,
      "completed-memories-onboarding": true,
    },
  });

  if (error) {
    logger.error("Error updating user metadata:", { error: error.message });
    await logger.flush();
    return { error: "Failed to update onboarding status." };
  }

  logger.info("Successfully updated onboarding status for user:", {
    userId: user.id,
    data,
  });
  await logger.flush();
  return { success: true };
}
