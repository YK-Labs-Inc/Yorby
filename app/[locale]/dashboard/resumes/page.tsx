import { createSupabaseServerClient } from "@/utils/supabase/server";
import { fetchUserCredits } from "./actions";
import { fetchHasSubscription } from "./actions";
import ResumeBuilder from "./components/ResumeBuilder";

export default async function ResumesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let hasSubscription = false;
  let credits = 0;
  if (user) {
    hasSubscription = await fetchHasSubscription(user.id || "");
    credits = await fetchUserCredits(user.id || "");
  }

  return (
    <ResumeBuilder
      hasSubscription={hasSubscription}
      credits={credits}
      user={user}
    />
  );
}
