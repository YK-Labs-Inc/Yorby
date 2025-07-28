"use client";

import { Button } from "@/components/ui/button";
import { Turnstile } from "@marsidev/react-turnstile";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";

interface ResendEmailFormProps {
  resendAction: (
    prevState: any,
    formData: FormData
  ) => Promise<{ success?: boolean; error?: string }>;
  resendButtonText: string;
}

function SubmitButton({ text }: { text: string }) {
  const { pending } = useFormStatus();
  const t = useTranslations("apply.confirmEmail.resendForm");

  return (
    <Button
      type="submit"
      variant="outline"
      className="w-full"
      disabled={pending}
    >
      {pending ? t("sendingButton") : text}
    </Button>
  );
}

export default function ResendEmailForm({
  resendAction,
  resendButtonText,
}: ResendEmailFormProps) {
  const [captchaToken, setCaptchaToken] = useState<string>("");
  const [state, formAction] = useFormState(resendAction, null);
  const t = useTranslations("apply.confirmEmail.resendForm");

  return (
    <form action={formAction} className="w-full space-y-4">
      <input type="hidden" name="captchaToken" value={captchaToken} />

      <div className="flex justify-center">
        <Turnstile
          siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
          onSuccess={setCaptchaToken}
          onError={() => setCaptchaToken("")}
          onExpire={() => setCaptchaToken("")}
        />
      </div>

      {state?.error && (
        <div className="text-sm text-red-600 text-center">{state.error}</div>
      )}

      {state?.success && (
        <div className="text-sm text-green-600 text-center">
          {t("successMessage")}
        </div>
      )}

      <SubmitButton text={resendButtonText} />
    </form>
  );
}
