"use client";

import { Button } from "@/components/ui/button";
import { Turnstile } from "@marsidev/react-turnstile";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import { resendConfirmationEmail } from "./actions";

function SubmitButton({ disabled, text }: { disabled: boolean; text: string }) {
  const { pending } = useFormStatus();
  const t = useTranslations("apply.confirmEmail.resendForm");

  return (
    <Button
      type="submit"
      variant="outline"
      className="w-full"
      disabled={pending || disabled}
    >
      {pending ? t("sendingButton") : text}
    </Button>
  );
}

export default function ResendEmailForm({
  companyId,
  jobId,
  interviewId,
}: {
  companyId: string;
  jobId: string;
  interviewId: string;
}) {
  const [captchaToken, setCaptchaToken] = useState<string>("");
  const [state, formAction] = useActionState(resendConfirmationEmail, {
    error: null,
    success: false,
  });
  const t = useTranslations("apply");
  const resendButtonText = t("confirmEmail.resendButton");

  return (
    <form action={formAction} className="w-full space-y-4">
      <input type="hidden" name="captchaToken" value={captchaToken} />
      <input type="hidden" name="companyId" value={companyId} />
      <input type="hidden" name="jobId" value={jobId} />
      <input type="hidden" name="interviewId" value={interviewId} />

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
          {t("confirmEmail.resendForm.successMessage")}
        </div>
      )}

      <SubmitButton text={resendButtonText} disabled={!captchaToken} />
    </form>
  );
}
