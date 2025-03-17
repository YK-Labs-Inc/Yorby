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
import { posthog } from "@/utils/tracking/serverUtils";
export default async function ResumePage({
  params,
}: {
  params: Promise<{ resumeId: string }>;
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
  const resumeBuilderRequiresEmail =
    (await posthog.getFeatureFlag("resume-builder-require-email", user.id)) ===
    "test";
  const isSubscriptionVariant =
    (await posthog.getFeatureFlag("subscription-price-test-1", user.id)) ===
    "test";
  const isFreemiumEnabled =
    (await posthog.getFeatureFlag("freemium-resume-experience", user.id)) ===
    "test";

  return (
    <ResumeBuilder
      resumeId={resumeId}
      hasSubscription={hasSubscription}
      credits={credits}
      user={user}
      resumeBuilderRequiresEmail={resumeBuilderRequiresEmail}
      isSubscriptionVariant={isSubscriptionVariant}
      isFreemiumEnabled={isFreemiumEnabled}
    />
  );
}
