import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { getTranslations } from "next-intl/server";

interface PageProps {
  params: Promise<{
    companyId: string;
    jobId: string;
  }>;
}

export default async function ApplicationSubmittedPage({ params }: PageProps) {
  const { companyId, jobId } = await params;
  const t = await getTranslations("apply");

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full px-4">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle>{t("applicationSubmitted.title")}</CardTitle>
            <CardDescription>
              {t("applicationSubmitted.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href={`/apply/company/${companyId}/job/${jobId}`}>
              <Button variant="outline" className="w-full">
                {t("applicationSubmitted.buttons.backToJob")}
              </Button>
            </Link>
            <Link href="/dashboard/jobs">
              <Button className="w-full">
                {t("applicationSubmitted.buttons.viewDashboard")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
