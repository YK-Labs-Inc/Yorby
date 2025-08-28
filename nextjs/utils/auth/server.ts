import {
  createAdminClient,
  createSupabaseServerClient,
} from "@/utils/supabase/server";

/**
 * Get the current authenticated user in a server component
 * @returns The user object or null if not authenticated
 */
export async function getServerUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Update the app metadata of the current authenticated user
 * @param fieldsToUpdate - The fields to update
 * @returns void
 */
export const updateUserAppMetadata = async (fieldsToUpdate: {
  [key: string]: string | boolean | number | null;
}) => {
  const supabase = await createAdminClient();
  const user = await getServerUser();
  if (!user) {
    throw new Error("User not found");
  }
  const { error } = await supabase.auth.admin.updateUserById(user.id, {
    app_metadata: { ...user.app_metadata, ...fieldsToUpdate },
  });
  if (error) {
    throw error;
  }
};
