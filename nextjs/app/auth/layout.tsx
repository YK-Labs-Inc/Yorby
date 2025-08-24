import { Building2, Users, TrendingUp, Zap, Briefcase } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { posthog } from "@/utils/tracking/serverUtils";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("auth.layout");
  
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
  
  // Redirect if user doesn't have access to recruiter portal
  if (!isRecruiterPortalEnabled) {
    redirect("/sign-in");
  }
  return (
    <div className="flex min-h-screen w-full">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[hsl(var(--chart-3))] to-[hsl(var(--primary))] p-12 flex-col justify-between text-white">
        <div>
          <div className="flex items-center gap-2 mb-12">
            <Building2 className="h-8 w-8" />
            <span className="text-2xl font-bold">{t("brandName")}</span>
          </div>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
            {t("mainTitle")}
          </h1>
          <p className="text-lg lg:text-xl opacity-90">{t("mainSubtitle")}</p>

          <div className="grid grid-cols-2 gap-6 mt-12">
            <div className="space-y-2">
              <Users className="h-8 w-8 opacity-80" />
              <h3 className="font-semibold">
                {t("features.smartScreening.title")}
              </h3>
              <p className="text-sm opacity-80">
                {t("features.smartScreening.description")}
              </p>
            </div>
            <div className="space-y-2">
              <TrendingUp className="h-8 w-8 opacity-80" />
              <h3 className="font-semibold">
                {t("features.betterInsights.title")}
              </h3>
              <p className="text-sm opacity-80">
                {t("features.betterInsights.description")}
              </p>
            </div>
            <div className="space-y-2">
              <Zap className="h-8 w-8 opacity-80" />
              <h3 className="font-semibold">
                {t("features.fasterProcess.title")}
              </h3>
              <p className="text-sm opacity-80">
                {t("features.fasterProcess.description")}
              </p>
            </div>
            <div className="space-y-2">
              <Building2 className="h-8 w-8 opacity-80" />
              <h3 className="font-semibold">
                {t("features.scaleEasily.title")}
              </h3>
              <p className="text-sm opacity-80">
                {t("features.scaleEasily.description")}
              </p>
            </div>
          </div>
        </div>

        {/* Candidate Portal CTA */}
        <div className="mt-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center space-y-4">
            <div className="flex justify-center">
              <Briefcase className="h-8 w-8 text-white/90" />
            </div>
            <p className="text-sm font-medium text-white/90">
              {t("candidatePortal.prompt")}
            </p>
            <Link href="/sign-in" className="block">
              <Button
                variant="secondary"
                className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                {t("candidatePortal.buttonText")}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Right Panel - Content */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
