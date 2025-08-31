import LandingPageV7 from "./LandingPageV7";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getServerUser } from "@/utils/auth/server";

export default async function Home() {
  const user = await getServerUser();

  const headersList = await headers();
  const hostname = headersList.get("host") || "";

  if (hostname === "recruiting.yorby.ai" && !user) {
    redirect("/auth/sign-up");
  }

  if (user) {
    redirect(
      user.app_metadata.completed_candidate_onboarding
        ? "/dashboard/jobs?newJob=true"
        : "/onboarding"
    );
  }

  return <LandingPageV7 />;
}
