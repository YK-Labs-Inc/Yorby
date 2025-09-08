import { Card, CardContent } from "@/components/ui/card";
import { Crown, CheckCircle2, ArrowLeft, Shield, Sparkles } from "lucide-react";
import Link from "next/link";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import UpgradeForm from "./UpgradeForm";
import { getTranslations } from "next-intl/server";

interface RecruitingPurchasePageProps {
  params: Promise<{ companyId: string }>;
}

async function getCompany(companyId: string) {
  const supabase = await createSupabaseServerClient();

  const { data: company, error } = await supabase
    .from("companies")
    .select("*")
    .eq("id", companyId)
    .single();

  if (error || !company) {
    redirect("/recruiting");
  }

  return company;
}

export default async function RecruitingPurchasePage({
  params,
}: RecruitingPurchasePageProps) {
  const { companyId } = await params;
  const company = await getCompany(companyId);
  const t = await getTranslations("apply.recruitingPurchasePage");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/recruiting/companies/${companyId}`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("navigation.backTo", { companyName: company.name })}
          </Link>

          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent mb-4">
              {t("header.title")}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              {t("header.subtitle")}
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          <Card className="border-0 shadow-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
            <CardContent className="p-8">
              {/* Pricing Section */}
              <div className="grid md:grid-cols-2 gap-8">
                {/* Left Column - Pricing Details */}
                <div className="space-y-6">
                  <div className="text-center md:text-left">
                    <div className="inline-flex items-center gap-2 mb-4">
                      <Crown className="h-8 w-8 text-yellow-600" />
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {t("pricing.planName")}
                      </span>
                    </div>

                    <div className="mb-6">
                      <div className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
                        {t("pricing.monthlyPrice")}
                        <span className="text-2xl font-normal text-gray-600 dark:text-gray-400">
                          {t("pricing.perMonth")}
                        </span>
                      </div>
                      <p className="text-lg text-gray-600 dark:text-gray-400">
                        {t("pricing.baseIncluded")}
                      </p>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-6 rounded-xl">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                        {t("pricing.usageBasedTitle")}
                      </h3>
                      <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                        <div className="flex items-center justify-between">
                          <span>{t("pricing.firstHundred")}</span>
                          <span className="font-semibold">
                            {t("pricing.included")}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>{t("pricing.additionalInterviews")}</span>
                          <span className="font-semibold">
                            {t("pricing.additionalPrice")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {t("features.title")}
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">
                          {t("features.candidateInterviews")}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">
                          {t("features.additionalInterviews")}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">
                          {t("features.aiAnalysis")}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">
                          {t("features.teamTools")}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">
                          {t("features.reporting")}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">
                          {t("features.customQuestions")}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">
                          {t("features.pipelineManagement")}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">
                          {t("features.videoRecordings")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Upgrade Form */}
                <div className="space-y-6">
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                      {t("howItWorks.title")}
                    </h3>
                    <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                      <p>
                        {t.rich("howItWorks.description1", {
                          strong: (chunks) => <strong>{chunks}</strong>,
                        })}
                      </p>
                      <p>
                        {t.rich("howItWorks.description2", {
                          strong: (chunks) => <strong>{chunks}</strong>,
                        })}
                      </p>
                      <p>{t("howItWorks.description3")}</p>
                      <p>{t("howItWorks.description4")}</p>
                    </div>
                  </div>

                  {/* Upgrade Form */}
                  <UpgradeForm companyId={companyId} />

                  {/* Trust Indicators */}
                  <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-2 gap-4 text-center text-sm">
                      <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400">
                        <Shield className="h-4 w-4 text-green-600" />
                        <span>{t("trustIndicators.sslSecured")}</span>
                      </div>
                      <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>{t("trustIndicators.cancelAnytime")}</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Sparkles className="h-4 w-4 text-green-600" />
                        <span>{t("trustIndicators.moneyBackGuarantee")}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FAQ or Additional Info */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              {t("footer.questionsText")}{" "}
              <a
                href="mailto:business@yklabs.io"
                className="text-blue-600 hover:text-blue-700 underline"
              >
                {t("footer.contactTeam")}
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
