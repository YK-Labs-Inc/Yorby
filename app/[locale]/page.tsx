import LandingPageV3 from "./LandingPageV3";
import LandingPageV4 from "./LandingPageV4";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { posthog } from "@/utils/tracking/serverUtils";
import {
  fetchUserCredits,
  fetchHasSubscription,
} from "./dashboard/resumes/actions";

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let hasSubscription = false;
  let credits = 0;
  let isSubscriptionVariant = false;
  let isFreemiumEnabled = false;

  if (user) {
    hasSubscription = await fetchHasSubscription(user.id);
    credits = await fetchUserCredits(user.id);
    isSubscriptionVariant =
      (await posthog.getFeatureFlag("subscription-price-test-1", user.id)) ===
      "test";
    isFreemiumEnabled =
      (await posthog.getFeatureFlag("freemium-resume-experience", user.id)) ===
      "test";
  }
  return (
    <LandingPageV4
      user={user}
      hasSubscription={hasSubscription}
      credits={credits}
      isSubscriptionVariant={isSubscriptionVariant}
      isFreemiumEnabled={isFreemiumEnabled}
    />
  );
}
