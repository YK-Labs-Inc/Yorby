"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export function DeviceComparisonModal() {
  const t = useTranslations("interviewCopilots.deviceSelection");

  const deviceTypes = ["sameDevice", "separateDevice"] as const;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full">
          {t("modal.learnMore")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("modal.title")}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-8 py-4">
          {deviceTypes.map((deviceType) => {
            const pros = t.raw(`${deviceType}.pros`) as string[];
            const cons = t.raw(`${deviceType}.cons`) as string[];

            return (
              <div key={deviceType} className="space-y-6">
                <div>
                  <h3 className="font-medium mb-2">
                    {t(`${deviceType}.title`)}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t(`${deviceType}.description`)}
                  </p>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">
                        Advantages
                      </h4>
                      <ul className="list-disc list-inside space-y-1">
                        {pros.map((pro: string, index: number) => (
                          <li
                            key={index}
                            className="text-sm text-muted-foreground"
                          >
                            {pro}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
                        Limitations
                      </h4>
                      <ul className="list-disc list-inside space-y-1">
                        {cons.map((con: string, index: number) => (
                          <li
                            key={index}
                            className="text-sm text-muted-foreground"
                          >
                            {con}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
