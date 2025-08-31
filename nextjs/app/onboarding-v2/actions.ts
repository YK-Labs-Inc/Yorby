"use server";

import { createAdminClient } from "@/utils/supabase/server";
import { getServerUser } from "@/utils/auth/server";
import { Logger } from "next-axiom";

export async function completeOnboarding() {
  const user = await getServerUser();

  const logger = new Logger().with({
    userId: user?.id,
    function: "completeOnboarding",
  });

  if (!user) {
    logger.error("Error fetching user:");
    await logger.flush();
    return { error: "User not found or error fetching user." };
  }

  const supabase = await createAdminClient();

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

export async function updateUserDisplayName(displayName: string) {
  const user = await getServerUser();

  const logger = new Logger().with({
    userId: user?.id,
    function: "updateUserDisplayName",
  });

  if (!user) {
    logger.error("Error fetching user");
    await logger.flush();
    return { error: "User not found or error fetching user." };
  }

  const supabase = await createAdminClient();

  const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...user.user_metadata,
      display_name: displayName,
    },
  });

  if (error) {
    logger.error("Error updating user display name:", { error: error.message });
    await logger.flush();
    return { error: "Failed to update display name." };
  }

  logger.info("Successfully updated display name for user:", {
    userId: user.id,
    displayName,
  });
  await logger.flush();
  return { success: true };
}
