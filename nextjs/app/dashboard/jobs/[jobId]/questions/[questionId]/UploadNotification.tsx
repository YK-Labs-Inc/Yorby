"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Upload, AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";

interface UploadNotificationProps {
  isVisible: boolean;
}

export default function UploadNotification({
  isVisible,
}: UploadNotificationProps) {
  const t = useTranslations("interviewQuestion");

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2 duration-300">
      <Card className="w-80 shadow-lg border border-border bg-card/95 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-foreground text-sm">
                  {t("uploadingRecording")}
                </h3>
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              </div>
              <p className="text-muted-foreground text-xs leading-relaxed">
                {t("uploadWarning")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
