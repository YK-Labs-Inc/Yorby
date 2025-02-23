"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { CheckCircle2, Sparkles, FileText } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CombinedOnboardingDialog({ open, onOpenChange }: Props) {
  const t = useTranslations("interviewQuestion");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {t("onboarding.title")}
          </DialogTitle>
          <DialogDescription className="text-lg pt-2">
            {t("onboarding.description")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-12">
          {/* Answer Recording Section */}
          <div className="space-y-8">
            <h3 className="text-xl font-semibold">Record Your Answers</h3>
            <div className="relative aspect-video rounded-lg overflow-hidden bg-black/5">
              <video
                src="/assets/question-answering-demo.mp4"
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay
                muted
                loop
                playsInline
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[1, 2, 3].map((featureNum) => (
                <div key={featureNum} className="flex flex-col gap-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    <h3 className="font-medium">
                      {t(`onboarding.features.${featureNum}.title`)}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground pl-7">
                    {t(`onboarding.features.${featureNum}.description`)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* AI Generation Section */}
          <div className="space-y-8 pt-6 border-t">
            <h3 className="text-xl font-semibold">
              {t("generateAnswerOnboarding.title")}
            </h3>
            <div className="relative aspect-video rounded-lg overflow-hidden bg-black/5">
              <video
                src="/assets/generate-answer-demo.mp4"
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay
                muted
                loop
                playsInline
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-5 w-5 text-primary shrink-0" />
                  <h3 className="font-medium">
                    {t("generateAnswerOnboarding.features.aiPowered.title")}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground pl-7">
                  {t("generateAnswerOnboarding.features.aiPowered.description")}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-start gap-2">
                  <FileText className="h-5 w-5 text-primary shrink-0" />
                  <h3 className="font-medium">
                    {t("generateAnswerOnboarding.features.personalized.title")}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground pl-7">
                  {t(
                    "generateAnswerOnboarding.features.personalized.description"
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end pt-6">
          <Button onClick={() => onOpenChange(false)}>
            {t("onboarding.button")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
