import DemoFeatures from "@/app/components/landing/DemoFeatures";
import { fetchUserCredits } from "../dashboard/resumes/actions";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { fetchHasSubscription } from "../dashboard/resumes/actions";
import { posthog } from "@/utils/tracking/serverUtils";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/sign-in");
  }
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
    <div className="pt-4">
      <DemoFeatures
        user={user}
        hasSubscription={hasSubscription}
        credits={credits}
        isFreemiumEnabled={isFreemiumEnabled}
        transformResumeEnabled={transformResumeEnabled}
        enableResumesFileUpload={enableResumesFileUpload}
      />
    </div>
  );
}
