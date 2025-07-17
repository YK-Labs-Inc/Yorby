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

  // Redirect to recruiting dashboard
  redirect("/recruiting");
}
