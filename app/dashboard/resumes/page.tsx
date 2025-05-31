import { createSupabaseServerClient } from "@/utils/supabase/server";
import { fetchUserCredits } from "./actions";
import { fetchHasSubscription } from "./actions";
import ResumeBuilder from "./components/ResumeBuilder";
import { posthog } from "@/utils/tracking/serverUtils";

export default async function ResumesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let hasSubscription = false;
  let credits = 0;
  let isFreemiumEnabled = false;
  let transformResumeEnabled = false;
  let enableResumesFileUpload = false;
  if (user) {
    hasSubscription = await fetchHasSubscription(user.id);
    credits = await fetchUserCredits(user.id);
    isFreemiumEnabled =
      (await posthog.getFeatureFlag("freemium-resume-experience", user.id)) ===
      "test";
    transformResumeEnabled =
      (await posthog.isFeatureEnabled("transform-resume-feature", user.id)) ??
      false;
    enableResumesFileUpload =
      (await posthog.isFeatureEnabled("enable-memories", user.id)) ?? false;
  }

  return (
    <ResumeBuilder
      hasSubscription={hasSubscription}
      credits={credits}
      user={user}
      isFreemiumEnabled={isFreemiumEnabled}
      transformResumeEnabled={transformResumeEnabled}
      enableResumesFileUpload={enableResumesFileUpload}
    />
  );
}
