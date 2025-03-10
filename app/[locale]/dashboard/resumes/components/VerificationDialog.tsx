"use client";

import { useTranslations } from "next-intl";
import { Turnstile } from "@marsidev/react-turnstile";
import { useActionState, useState } from "react";
import { verifyAnonymousUser } from "../actions";
import { FormMessage } from "@/components/form-message";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function VerificationDialog() {
  const t = useTranslations("resumeBuilder");
  const [captchaToken, setCaptchaToken] = useState<string>("");
  const [state, formAction, pending] = useActionState(verifyAnonymousUser, {
    error: "",
  });

  return (
    <Dialog open={true}>
      <DialogContent hideClose>
        <DialogHeader>
          <DialogTitle>{t("verification.title")}</DialogTitle>
          <DialogDescription>{t("verification.description")}</DialogDescription>
        </DialogHeader>
        <form
          action={formAction}
          className="space-y-4 flex flex-col items-center justify-center"
        >
          <input type="hidden" name="captchaToken" value={captchaToken} />
          <Button type="submit" disabled={!captchaToken || pending}>
            {t("verification.submit")}
          </Button>
          <div className="flex justify-center">
            <Turnstile
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
              onSuccess={(token) => {
                setCaptchaToken(token);
              }}
            />
          </div>
          {state?.error && <FormMessage message={{ error: state.error }} />}
        </form>
      </DialogContent>
    </Dialog>
  );
}
