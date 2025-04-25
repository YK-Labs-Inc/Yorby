import { createSupabaseServerClient } from "@/utils/supabase/server";
import ResumeBuilder from "../components/ResumeBuilder";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { getTranslations } from "next-intl/server";
import {
  fetchResume,
  fetchHasSubscription,
  fetchUserCredits,
} from "../actions";
import { posthog, trackServerEvent } from "@/utils/tracking/serverUtils";
export default async function ResumePage({
  params,
  searchParams,
}: {
  params: Promise<{ resumeId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const t = await getTranslations("resumeBuilder");
  const resumeId = (await params).resumeId;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/sign-in");
  }
  const resume = await fetchResume(resumeId);
  if (!resume) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">
            {t("errors.notFound.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("errors.notFound.description")}
          </p>
          <div className="pt-4">
            <Link href="/dashboard/resumes">
              <Button>{t("errors.notFound.action")}</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }
  const hasSubscription = await fetchHasSubscription(user.id);
  const credits = await fetchUserCredits(user.id);
  const isSubscriptionVariant =
    (await posthog.getFeatureFlag("subscription-price-test-1", user.id)) ===
    "test";
  const isFreemiumEnabled =
    (await posthog.getFeatureFlag("freemium-resume-experience", user.id)) ===
    "test";
  const transformResumeEnabled = await posthog.isFeatureEnabled(
    "transform-resume-feature",
    user.id
  );
  const enableResumesFileUpload =
    (await posthog.isFeatureEnabled("enable-memories", user.id)) ?? false;
  const transformSummary = (await searchParams)?.transformSummary as
    | string
    | undefined;
  if (transformSummary) {
    void trackServerEvent({
      userId: user.id,
      email: user.email,
      eventName: "transformed-resume",
      args: { resumeId },
    });
  }
  return (
    <ResumeBuilder
      resumeId={resumeId}
      hasSubscription={hasSubscription}
      credits={credits}
      user={user}
      isSubscriptionVariant={isSubscriptionVariant}
      isFreemiumEnabled={isFreemiumEnabled}
      transformResumeEnabled={transformResumeEnabled ?? false}
      transformSummary={transformSummary}
      enableResumesFileUpload={enableResumesFileUpload}
    />
  );
}
