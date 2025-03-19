import LandingPageV3 from "./LandingPageV3";
import LandingPageV4 from "./LandingPageV4";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { posthog } from "@/utils/tracking/serverUtils";
import {
  fetchUserCredits,
  fetchHasSubscription,
} from "./dashboard/resumes/actions";

export const maxDuration = 300;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { dev } = await searchParams;

  if (dev === "true") {
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
        (await posthog.getFeatureFlag(
          "freemium-resume-experience",
          user.id
        )) === "test";
      resumeBuilderRequiresEmail =
        (await posthog.getFeatureFlag(
          "resume-builder-require-email",
          user.id
        )) === "test";
    }
    return (
      <div className="flex flex-col gap-6 max-w-[1080px] mx-auto justify-center min-h-screen items-center">
        <LandingPageV4
          user={user}
          hasSubscription={hasSubscription}
          credits={credits}
          isSubscriptionVariant={isSubscriptionVariant}
          isFreemiumEnabled={isFreemiumEnabled}
          resumeBuilderRequiresEmail={resumeBuilderRequiresEmail}
        />
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-6 max-w-[1080px] mx-auto justify-center min-h-screen items-center">
      <LandingPageV3 />
    </div>
  );
}
