"use client";

import { Button } from "@/components/ui/button";
import { upgradeCompany } from "../../recruiting/companies/[id]/actions";
import { useActionState } from "react";
import { Loader2, Crown } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface UpgradeFormProps {
  companyId: string;
}

export default function UpgradeForm({ companyId }: UpgradeFormProps) {
  const [state, formAction, isPending] = useActionState(upgradeCompany, {
    error: "",
  });
  const t = useTranslations("apply.recruitingPurchasePage.upgradeForm");

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="company_id" value={companyId} />
      
      <Button 
        type="submit" 
        disabled={isPending}
        className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:scale-[1.01] transition-all duration-200"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            {t("processingUpgrade")}
          </>
        ) : (
          <>
            <Crown className="mr-2 h-5 w-5" />
            {t("upgradeButton")}
          </>
        )}
      </Button>
      
      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
        {t("termsNotice")}
      </p>
    </form>
  );
}