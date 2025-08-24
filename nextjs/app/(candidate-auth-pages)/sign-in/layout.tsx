import { Award, Briefcase, Target, Users, Building2 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { posthog } from "@/utils/tracking/serverUtils";
import { createSupabaseServerClient } from "@/utils/supabase/server";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const namespace =
    // featureFlags.isRecruitingEnabled
    //   ? "auth.candidateSignInLayout"
    "auth.candidateInterviewSignInLayout";
  const t = await getTranslations(namespace);
  
  // Check if recruiter portal is enabled
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  let isRecruiterPortalEnabled = false;
  if (user) {
    isRecruiterPortalEnabled = Boolean(
      await posthog.isFeatureEnabled("enable-recruiter-portal", user.id)
    );
  }
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-muted to-background flex flex-col lg:flex-row">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-white/[0.03] dark:bg-grid-white/[0.02] pointer-events-none" />

      {/* Left/Top Section - Welcome Message */}
      <div className="flex-1 flex flex-col justify-between p-8 lg:p-16 text-foreground relative">
        <div className="max-w-2xl mx-auto lg:mx-0 space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-muted rounded-full text-sm font-medium text-foreground">
            <Briefcase className="h-8 w-8" />
            <span className="text-2xl font-bold">{t("badge")}</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
              {t("titleLine1")}
              <br />
              {t("titleLine2")}
            </h1>
            <p className="text-lg lg:text-xl opacity-90 max-w-lg">
              {t("subtitle")}
            </p>
          </div>

          {/* Feature Points */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-12">
            <div className="flex items-start gap-3">
              <Target className="h-5 w-5 mt-0.5 flex-shrink-0 text-foreground/70" />
              <div>
                <h3 className="font-semibold">
                  {t("features.smartMatching.title")}
                </h3>
                <p className="text-sm opacity-80">
                  {t("features.smartMatching.description")}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Award className="h-5 w-5 mt-0.5 flex-shrink-0 text-foreground/70" />
              <div>
                <h3 className="font-semibold">
                  {t("features.showcaseSkills.title")}
                </h3>
                <p className="text-sm opacity-80">
                  {t("features.showcaseSkills.description")}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 mt-0.5 flex-shrink-0 text-foreground/70" />
              <div>
                <h3 className="font-semibold">
                  {t("features.topCompanies.title")}
                </h3>
                <p className="text-sm opacity-80">
                  {t("features.topCompanies.description")}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Briefcase className="h-5 w-5 mt-0.5 flex-shrink-0 text-foreground/70" />
              <div>
                <h3 className="font-semibold">
                  {t("features.trackProgress.title")}
                </h3>
                <p className="text-sm opacity-80">
                  {t("features.trackProgress.description")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Organization Portal CTA */}
        {isRecruiterPortalEnabled && (
          <div className="w-full max-w-2xl mx-auto lg:mx-0">
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-8 text-center space-y-4">
              <div className="flex justify-center">
                <Building2 className="h-10 w-10 text-[hsl(var(--chart-3))]" />
              </div>
              <p className="text-base font-medium">
                {t("organizationPortal.prompt")}
              </p>
              <Link href="/auth/login" className="block">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full border-[hsl(var(--chart-3))]/50 text-[hsl(var(--chart-3))] hover:bg-[hsl(var(--chart-3))] hover:text-white hover:border-[hsl(var(--chart-3))] transition-all duration-200"
                >
                  {t("organizationPortal.buttonText")}
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Right/Bottom Section - Sign In Form */}
      <div className="flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-lg p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
