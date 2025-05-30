"use client";

import { AIButton } from "@/components/ai-button";
import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import { FormMessage } from "@/components/form-message";
import { verifyAnonymousUser } from "./actions";

export default function VerifyUser() {
  const t = useTranslations("interviewCopilotDemo.verifyUser");
  const [captchaToken, setCaptchaToken] = useState<string>("");
  const [state, action, pending] = useActionState(verifyAnonymousUser, {
    error: "",
  });
  return (
    <form
      action={action}
      className="flex flex-col items-center justify-center h-full gap-4"
    >
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <input type="hidden" name="captchaToken" value={captchaToken} />
      <AIButton pending={pending} pendingText={t("submitting")} size="lg">
        {t("submit")}
      </AIButton>
      <div className="flex justify-center mt-4">
        <Turnstile
          siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
          onSuccess={(token) => {
            setCaptchaToken(token);
          }}
        />
      </div>
      {state?.error && <FormMessage message={{ error: state.error }} />}
    </form>
  );
}
