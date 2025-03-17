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
  let isSubscriptionVariant = false;
  let isFreemiumEnabled = false;
  let resumeBuilderRequiresEmail = false;
  if (user) {
    hasSubscription = await fetchHasSubscription(user.id);
    credits = await fetchUserCredits(user.id);
    isSubscriptionVariant =
      (await posthog.getFeatureFlag("subscription-price-test-1", user.id)) ===
      "test";
    isFreemiumEnabled =
      (await posthog.getFeatureFlag("freemium-resume-experience", user.id)) ===
      "test";
    resumeBuilderRequiresEmail =
      (await posthog.getFeatureFlag(
        "resume-builder-require-email",
        user.id
      )) === "test";
  }

  return (
    <ResumeBuilder
      hasSubscription={hasSubscription}
      credits={credits}
      user={user}
      isSubscriptionVariant={isSubscriptionVariant}
      isFreemiumEnabled={isFreemiumEnabled}
      resumeBuilderRequiresEmail={resumeBuilderRequiresEmail}
    />
  );
}
