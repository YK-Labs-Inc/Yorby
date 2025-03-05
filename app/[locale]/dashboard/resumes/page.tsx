import { createSupabaseServerClient } from "@/utils/supabase/server";
import { fetchUserCredits } from "./actions";
import { fetchHasSubscription } from "./actions";
import ResumeBuilder from "./components/ResumeBuilder";
import { redirect } from "next/navigation";

export default async function ResumesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/sign-in");
  }
  const hasSubscription = await fetchHasSubscription(user?.id || "");
  const credits = await fetchUserCredits(user?.id || "");
  const isAnonymous = user?.is_anonymous ?? true;
  return (
    <ResumeBuilder
      hasSubscription={hasSubscription}
      isAnonymous={isAnonymous}
      credits={credits}
    />
  );
}
