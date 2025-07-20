"use client";

import { PreJoin } from "@livekit/components-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
