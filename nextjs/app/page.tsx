import LandingPageV6 from "./LandingPageV6";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (user) {
    redirect("/onboarding");
  }
  
  return <LandingPageV6 />;
}
