import { createSupabaseServerClient } from "@/utils/supabase/server";
import { posthog } from "@/utils/tracking/serverUtils";
import { fetchUserCredits } from "../dashboard/resumes/actions";
import { fetchHasSubscription } from "../dashboard/resumes/actions";
import ResumeBuilder from "../dashboard/resumes/components/ResumeBuilder";
import { PathHeader } from "@/components/marketing/PathHeader";

export default async function ChatToResume() {
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
    <>
      {!user && <PathHeader />}
      <div className="h-[calc(100vh-64px)] flex flex-col">
        <ResumeBuilder
          hasSubscription={hasSubscription}
          credits={credits}
          user={user}
          isSubscriptionVariant={isSubscriptionVariant}
          isFreemiumEnabled={isFreemiumEnabled}
        />
      </div>
    </>
  );
}
