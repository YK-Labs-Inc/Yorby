import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/logout-button";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";

export default async function ProtectedPage() {
  const supabase = await createClient();
  const t = await getTranslations("auth.protected");

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login");
  }

  // Check if user needs company onboarding
  const { data: membership } = await supabase
    .from("company_members")
    .select("id")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (!membership) {
    // User doesn't have a company, redirect to company onboarding
    redirect("/company-onboarding");
  }

  // If user has a company, redirect to company dashboard
  redirect("/dashboard/company");
}
