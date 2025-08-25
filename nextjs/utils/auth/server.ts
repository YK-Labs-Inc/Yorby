import { createSupabaseServerClient } from "@/utils/supabase/server";

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
