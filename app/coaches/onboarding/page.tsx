import { createSupabaseServerClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import YorbyOnboarding from "./YorbyOnboarding";

export default async function YorbyOnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Check if user already has a display name
  const params = await searchParams;
  const redirectTo = params?.redirect || "/coaches/auth";
  
  if (user.user_metadata?.display_name) {
    redirect(redirectTo);
  }

  return <YorbyOnboarding redirectTo={redirectTo} />;
}