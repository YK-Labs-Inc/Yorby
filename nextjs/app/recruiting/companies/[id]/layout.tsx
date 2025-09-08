import { createSupabaseServerClient } from "@/utils/supabase/server";
import { AlertCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { UpgradeButton } from "./UpgradeButton";
import { FREE_TIER_INTERVIEW_COUNT } from "./jobs/[jobId]/candidates/constants";

export default async function CompanyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id: companyId } = await params;
  const supabase = await createSupabaseServerClient();
  const t = await getTranslations("apply");

  // Check if company has a subscription
  const { data: subscription } = await supabase
    .from("recruiting_subscriptions")
    .select("company_id")
    .eq("company_id", companyId)
    .single();

  const isFreeTier = !subscription;

  return (
    <div>
      {isFreeTier && (
        <div className="m-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="mt-0.5">
              <AlertCircle className="h-4 w-4 text-primary/60" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                {t("freeTierBanner.title", {
                  count: FREE_TIER_INTERVIEW_COUNT,
                })}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("freeTierBanner.description")}
              </p>
            </div>
            <UpgradeButton companyId={companyId} />
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
