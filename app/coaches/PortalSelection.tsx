"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, GraduationCap } from "lucide-react";
import SignInForm from "../(auth-pages)/sign-in/SignInForm";
import { useTranslations } from "next-intl";

export default function PortalSelection() {
  const t = useTranslations("signIn.portalSelection");
  const [selectedPortal, setSelectedPortal] = useState<
    "coach" | "student" | null
  >(null);

  if (selectedPortal) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => setSelectedPortal(null)}
          className="mb-4"
        >
          ← {t("backToSelection")}
        </Button>
        <SignInForm
          redirectUrl={
            selectedPortal === "coach" ? "/coaches/auth" : "/student-programs"
          }
        />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card
            className="cursor-pointer transition-all hover:shadow-lg hover:border-primary"
            onClick={() => setSelectedPortal("coach")}
          >
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>{t("coach.title")}</CardTitle>
              <CardDescription>{t("coach.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• {t("coach.features.managePrograms")}</li>
                <li>• {t("coach.features.createQuestions")}</li>
                <li>• {t("coach.features.reviewProgress")}</li>
                <li>• {t("coach.features.provideFeedback")}</li>
              </ul>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer transition-all hover:shadow-lg hover:border-primary"
            onClick={() => setSelectedPortal("student")}
          >
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>{t("student.title")}</CardTitle>
              <CardDescription>{t("student.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• {t("student.features.practiceQuestions")}</li>
                <li>• {t("student.features.mockInterviews")}</li>
                <li>• {t("student.features.buildResume")}</li>
                <li>• {t("student.features.aiFeedback")}</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
