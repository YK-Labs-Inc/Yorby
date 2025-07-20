"use client";

import { PreJoin } from "@livekit/components-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Info, Mic, Video } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTranslations } from "next-intl";

interface MockInterviewPreJoinProps {
  onSubmit: () => void;
}

export function MockInterviewPreJoin({ onSubmit }: MockInterviewPreJoinProps) {
  const t = useTranslations("apply.interviews.mockInterview");
  console.log("t", t("button"));
  const tLabels = useTranslations("apply.interviews.livekit.labels");

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>{t("alert")}</AlertDescription>
          </Alert>

          <div className="space-y-3">
            <h3 className="font-semibold text-lg">
              {t("whatToExpect.heading")}
            </h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-gray-400 mt-1">•</span>
                <span>{t("whatToExpect.points.aiQuestions")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400 mt-1">•</span>
                <span>{t("whatToExpect.points.takeTime")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400 mt-1">•</span>
                <span>{t("whatToExpect.points.feedback")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400 mt-1">•</span>
                <span>{t("whatToExpect.points.restart")}</span>
              </li>
            </ul>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Mic className="h-4 w-4" />
              <Video className="h-4 w-4" />
              {t("equipmentCheck.heading")}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t("equipmentCheck.description")}
            </p>
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
