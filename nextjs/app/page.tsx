import LandingPageV6 from "./LandingPageV6";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const headersList = await headers();
  const hostname = headersList.get("host") || "";

  if (hostname === "recruiting.yorby.ai" && !user) {
    redirect("/auth/sign-up");
  }

  if (user) {
    redirect("/onboarding");
  }

  return <LandingPageV6 />;
}
