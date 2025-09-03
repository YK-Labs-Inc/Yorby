"use client";
import { ShareButton } from "@/components/ui/share-button";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Send } from "lucide-react";

export default function ShareApplicationSection({
  companyId,
  jobId,
}: {
  companyId: string;
  jobId: string;
}) {
  const t = useTranslations("apply.recruiting");
  const applicationUrl = `${origin}/apply/company/${companyId}/job/${jobId}`;
  
  return (
    <Card className="mb-8 border-primary/20 bg-primary/5">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Send className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">
              {t("shareSection.title")}
            </CardTitle>
            <CardDescription className="mt-1">
              {t("shareSection.description")}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-2">
              {t("shareSection.helpText")}
            </p>
            <code className="text-xs bg-muted px-2 py-1 rounded break-all">
              {applicationUrl}
            </code>
          </div>
          <ShareButton
            titleOverride={t("shareSection.buttonText")}
            url={applicationUrl}
          />
        </div>
      </CardContent>
    </Card>
  );
}