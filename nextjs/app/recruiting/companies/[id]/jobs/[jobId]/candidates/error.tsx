"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("apply.recruiting.candidates.error");

  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Candidates page error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle>{t("title")}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{t("description")}</p>
          <div className="flex gap-2">
            <Button onClick={reset} variant="default">
              {t("tryAgain")}
            </Button>
            <Button variant="outline" asChild>
              <Link href="/recruiting">{t("backToRecruiting")}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
