import { createSupabaseServerClient } from "@/utils/supabase/server";
import { fetchUserCredits } from "./actions";
import { fetchHasSubscription } from "./actions";
import ResumeBuilder from "./components/ResumeBuilder";
import { VerificationDialog } from "./components/VerificationDialog";

export default async function ResumesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const hasSubscription = await fetchHasSubscription(user?.id || "");
  const credits = await fetchUserCredits(user?.id || "");

  if (!user) {
    return <VerificationDialog />;
  }

  return (
    <ResumeBuilder
      hasSubscription={hasSubscription}
      credits={credits}
      user={user}
    />
  );
}
