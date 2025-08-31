"use client";

import { Button } from "@/components/ui/button";
import { upgradeCompany } from "./actions";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";

interface UpgradeButtonProps {
  companyId: string;
  label: string;
}

export function UpgradeButton({ companyId, label }: UpgradeButtonProps) {
  const [state, formAction, isPending] = useActionState(upgradeCompany, {
    error: "",
  });

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form action={formAction}>
      <input type="hidden" name="company_id" value={companyId} />
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        className="text-primary hover:text-primary/80"
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          label
        )}
      </Button>
    </form>
  );
}
