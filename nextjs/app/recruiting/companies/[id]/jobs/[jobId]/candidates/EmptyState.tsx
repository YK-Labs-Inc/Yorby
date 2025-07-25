"use client";

import { Card, CardContent } from "@/components/ui/card";
import { User } from "lucide-react";
import { useTranslations } from "next-intl";

export default function EmptyState() {
  const t = useTranslations("apply.recruiting.candidates.emptyState");

  return (
    <Card className="h-full flex items-center justify-center border shadow-sm rounded-l-none border-l-0">
      <CardContent className="text-center">
        <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">{t("title")}</h3>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </CardContent>
    </Card>
  );
}
