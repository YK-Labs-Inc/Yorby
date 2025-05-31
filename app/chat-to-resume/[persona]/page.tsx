import { createSupabaseServerClient } from "@/utils/supabase/server";
import { posthog } from "@/utils/tracking/serverUtils";
import { fetchUserCredits } from "../../dashboard/resumes/actions";
import { fetchHasSubscription } from "../../dashboard/resumes/actions";
import ResumeBuilder from "../../dashboard/resumes/components/ResumeBuilder";
import { PathHeader } from "@/components/marketing/PathHeader";

export default async function ChatToResume({
  params,
}: {
  params: Promise<{ persona: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const { persona } = await params;
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
    <div className="h-screen flex flex-col">
      {!user && <PathHeader />}
      <ResumeBuilder
        hasSubscription={hasSubscription}
        credits={credits}
        user={user}
        isFreemiumEnabled={isFreemiumEnabled}
        persona={persona}
        transformResumeEnabled={transformResumeEnabled}
        enableResumesFileUpload={enableResumesFileUpload}
      />
    </div>
  );
}
