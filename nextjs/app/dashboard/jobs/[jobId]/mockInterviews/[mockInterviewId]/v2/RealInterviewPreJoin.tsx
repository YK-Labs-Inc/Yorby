"use client";

import { PreJoin } from "@livekit/components-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, Clock, Mic, Video, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from "next-intl";

interface RealInterviewPreJoinProps {
  onSubmit: () => void;
}

export function RealInterviewPreJoin({ onSubmit }: RealInterviewPreJoinProps) {
  const t = useTranslations("apply.interviews.realInterview");
  const tLabels = useTranslations("apply.interviews.livekit.labels");

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="border-orange-200 dark:border-orange-900">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-orange-500" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert
            variant="default"
            className="border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950"
          >
            <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <AlertTitle className="text-orange-900 dark:text-orange-100">
              {t("alert.title")}
            </AlertTitle>
            <AlertDescription className="text-orange-800 dark:text-orange-200">
              {t("alert.description")}
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-3">
                {t("beforeYouBegin.heading")}
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">
                      {t("beforeYouBegin.checklist.quietEnvironment.title")}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t(
                        "beforeYouBegin.checklist.quietEnvironment.description"
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">
                      {t("beforeYouBegin.checklist.testEquipment.title")}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t("beforeYouBegin.checklist.testEquipment.description")}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">
                      {t("beforeYouBegin.checklist.materials.title")}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t("beforeYouBegin.checklist.materials.description")}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">
                      {t("beforeYouBegin.checklist.dress.title")}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t("beforeYouBegin.checklist.dress.description")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {t("duration.heading")}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t("duration.description")}
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Mic className="h-4 w-4" />
                <Video className="h-4 w-4" />
                {t("finalCheck.heading")}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t("finalCheck.description")}
              </p>
            </div>
          </div>

          <div data-lk-theme="default" className="rounded-lg overflow-hidden">
            <PreJoin
              onSubmit={onSubmit}
              joinLabel={t("button")}
              micLabel={tLabels("microphone")}
              camLabel={tLabels("camera")}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
