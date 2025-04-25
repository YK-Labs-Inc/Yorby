import { createSupabaseServerClient } from "@/utils/supabase/server";
import { posthog } from "@/utils/tracking/serverUtils";
import {
  fetchUserCredits,
  fetchHasSubscription,
} from "./dashboard/resumes/actions";
import LandingPageV5 from "./LandingPageV5";
import LandingPageV6 from "./LandingPageV6";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const v6 = (await searchParams)?.["v6"] === "true";
  let hasSubscription = false;
  let credits = 0;
  let isSubscriptionVariant = false;
  let isFreemiumEnabled = false;
  let transformResumeEnabled = false;
  let enableResumesFileUpload = false;
  if (user) {
    hasSubscription = await fetchHasSubscription(user.id);
    credits = await fetchUserCredits(user.id);
    isSubscriptionVariant =
      (await posthog.getFeatureFlag("subscription-price-test-1", user.id)) ===
      "test";
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
    <LandingPageV6
      user={user}
      hasSubscription={hasSubscription}
      credits={credits}
      isSubscriptionVariant={isSubscriptionVariant}
      isFreemiumEnabled={isFreemiumEnabled}
      transformResumeEnabled={transformResumeEnabled}
      enableResumesFileUpload={enableResumesFileUpload}
    />
  );
}
