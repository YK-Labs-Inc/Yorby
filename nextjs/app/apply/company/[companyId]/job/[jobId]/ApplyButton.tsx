"use client";

import { useActionState, useEffect, useState } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { handleApplyAction } from "./actions";
import { toast } from "sonner";

interface ApplyButtonProps {
  companyId: string;
  jobId: string;
  userId: string | null;
}

export default function ApplyButton({
  companyId,
  jobId,
  userId,
}: ApplyButtonProps) {
  const t = useTranslations("apply");
  const [captchaToken, setCaptchaToken] = useState<string>("");
  const [state, formAction, isPending] = useActionState(handleApplyAction, {
    error: "",
  });

  useEffect(() => {
    if (state.error) {
      toast.error(state.error);
    }
  }, [state.error]);

  return (
    <form action={formAction}>
      <input type="hidden" name="companyId" value={companyId} />
      <input type="hidden" name="jobId" value={jobId} />
      <input type="hidden" name="userId" value={userId || ""} />
      <input type="hidden" name="captchaToken" value={captchaToken} />

      <div className="space-y-4">
        <Button
          type="submit"
          size="lg"
          className="w-full sm:w-auto"
          disabled={!captchaToken || isPending}
        >
          {t("jobPage.buttons.applyNow")}
        </Button>

        <div className="flex justify-center">
          <Turnstile
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
            onSuccess={(token) => {
              setCaptchaToken(token);
            }}
          />
        </div>
      </div>
    </form>
  );
}
