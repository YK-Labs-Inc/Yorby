import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, Mic, Clock, ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

interface PageProps {
  params: Promise<{
    companyId: string;
    jobId: string;
  }>;
}

export default async function InterviewPage({ params }: PageProps) {
  const { companyId, jobId } = await params;
  const t = await getTranslations("apply");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Interview Header */}
        <Card className="mb-6">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {t("interview.header.title")}
            </CardTitle>
            <CardDescription>
              {t("interview.header.description")}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Interview Instructions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              {t("interview.instructions.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-blue-600">1</span>
                </div>
                <div>
                  <h4 className="font-medium">
                    {t("interview.instructions.sections.preparation.title")}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {t(
                      "interview.instructions.sections.preparation.description"
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-blue-600">2</span>
                </div>
                <div>
                  <h4 className="font-medium">
                    {t("interview.instructions.sections.duration.title")}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {t("interview.instructions.sections.duration.description")}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-blue-600">3</span>
                </div>
                <div>
                  <h4 className="font-medium">
                    {t("interview.instructions.sections.questions.title")}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {t("interview.instructions.sections.questions.description")}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tips for Success */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              {t("interview.tips.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• {t("interview.tips.items.0")}</li>
              <li>• {t("interview.tips.items.1")}</li>
              <li>• {t("interview.tips.items.2")}</li>
              <li>• {t("interview.tips.items.3")}</li>
            </ul>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <Button variant="outline" size="lg">
            <Clock className="h-4 w-4 mr-2" />
            {t("interview.buttons.startLater")}
          </Button>
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
            <Video className="h-4 w-4 mr-2" />
            {t("interview.buttons.startNow")}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        {/* Placeholder Notice */}
        <Card className="mt-6 border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-amber-800">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              <p className="text-sm font-medium">
                {t("interview.placeholder")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
