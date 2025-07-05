import CloneDemoJobClientComponent from "./CloneDemoJobClientComponent";
import { fetchDemoJob } from "./actions";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function CloneDemoJob({
  params,
}: {
  params: Promise<{ demoJobId: string }>;
}) {
  const t = await getTranslations("demoJobs");
  const demoJobId = (await params).demoJobId;
  const demoJob = await fetchDemoJob(demoJobId);

  if (!demoJob) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-8">
        <div className="text-center space-y-6">
          <div className="space-y-3">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {t("errors.demoJobNotFound")}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
              {t("errors.createYourOwn")}
            </p>
          </div>
          <Link href="/" className="inline-block">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              {t("actions.goToHome")}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return <CloneDemoJobClientComponent demoJob={demoJob} />;
}
