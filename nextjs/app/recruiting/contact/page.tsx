"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mail, Clock, MessageCircle, Wrench } from "lucide-react";
import { useTranslations } from "next-intl";

export default function ContactPage() {
  const t = useTranslations("apply.contact");
  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">{t("title")}</h1>
        <p className="text-lg text-muted-foreground">
          {t("description")}
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {t("dropUsALine.title")}
          </CardTitle>
          <CardDescription>
            {t("dropUsALine.subtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <Button
              size="lg"
              className="text-lg px-8"
              onClick={() => window.open("mailto:business@yklabs.io", "_blank")}
            >
              {t("dropUsALine.emailButton")}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <MessageCircle className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <h3 className="font-semibold">{t("helpCategories.sales.title")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("helpCategories.sales.description")}
              </p>
            </div>

            <div className="text-center p-4 rounded-lg bg-muted/50">
              <Wrench className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <h3 className="font-semibold">{t("helpCategories.technical.title")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("helpCategories.technical.description")}
              </p>
            </div>

            <div className="text-center p-4 rounded-lg bg-muted/50">
              <MessageCircle className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <h3 className="font-semibold">{t("helpCategories.general.title")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("helpCategories.general.description")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{t("responseTime.main")}</span>
          </div>
          <p className="text-center text-sm text-muted-foreground mt-2">
            {t("responseTime.subtext")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
