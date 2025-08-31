"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Users, Infinity } from "lucide-react";
import { upgradeCompany } from "./companies/[id]/actions";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface CompanyUpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
}

export function CompanyUpgradeDialog({
  open,
  onOpenChange,
  companyId,
}: CompanyUpgradeDialogProps) {
  const t = useTranslations("company.upgradeDialog");
  const [state, formAction, isPending] = useActionState(upgradeCompany, {
    error: "",
  });

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Crown className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-xl">{t("title")}</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            {t("description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">{t("features.teamCollaboration.title")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("features.teamCollaboration.description")}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Infinity className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">{t("features.unlimitedInterviews.title")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("features.unlimitedInterviews.description")}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-sm font-medium text-foreground">
              {t("cta.emoji")} {t("cta.title")}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {t("cta.description")}
            </p>
          </div>

          <form action={formAction} className="space-y-3">
            <input type="hidden" name="company_id" value={companyId} />
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("buttons.processing")}
                </>
              ) : (
                <>
                  <Crown className="mr-2 h-4 w-4" />
                  {t("buttons.upgrade")}
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => onOpenChange(false)}
            >
              {t("buttons.maybeLater")}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
