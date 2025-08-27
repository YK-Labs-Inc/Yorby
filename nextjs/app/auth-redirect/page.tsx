import { createSupabaseServerClient } from "@/utils/supabase/server";
import { getServerUser } from "@/utils/auth/server";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const user = await getServerUser();

  if (!user) {
    redirect("/auth/login");
  }

  const supabase = await createSupabaseServerClient();
  const { data: authUser } = await supabase.auth.getUser();

  const completedOnboarding =
    authUser?.user?.user_metadata?.completed_onboarding_funnel;

  if (completedOnboarding) {
    redirect("/recruiting");
  } else {
    redirect("/recruiting-onboarding");
  }
}
