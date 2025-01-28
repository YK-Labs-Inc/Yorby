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
import { CheckCircle2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OnboardingDialog({ open, onOpenChange }: Props) {
  const t = useTranslations("interviewQuestion.onboarding");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">{t("title")}</DialogTitle>
          <DialogDescription className="text-lg pt-2">
            {t("description")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-8">
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
                    {t(`features.${featureNum}.title`)}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground pl-7">
                  {t(`features.${featureNum}.description`)}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>{t("button")}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
