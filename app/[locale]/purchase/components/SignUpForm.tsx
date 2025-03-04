"use client";

import { FormMessage, Message } from "@/components/form-message";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";
import { signInWithOTP } from "@/app/[locale]/(auth-pages)/actions";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Turnstile } from "@marsidev/react-turnstile";
import { useActionState, useState } from "react";

export default function SignUpForm() {
  const t = useTranslations("purchase");
  const pathname = usePathname();

  const [state, action, pending] = useActionState(signInWithOTP, {
    success: "",
    error: undefined,
  });
  const [captchaToken, setCaptchaToken] = useState<string>("");

  let formMessage: Message | undefined;
  if (state.success) {
    formMessage = { success: state.success };
  } else if (state.error) {
    formMessage = { error: state.error };
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">{t("unauthenticated.title")}</h1>
        <p className="text-muted-foreground">
          {t("unauthenticated.description")}
        </p>
      </div>

      <form action={action} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t("unauthenticated.form.email.label")}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder={t("unauthenticated.form.email.placeholder")}
            required
          />
        </div>
        <input type="hidden" name="captchaToken" value={captchaToken} />
        <input type="hidden" name="redirectTo" value={pathname} />
        <SubmitButton
          pendingText={t("unauthenticated.form.submit")}
          disabled={!captchaToken || pending}
          type="submit"
          className="w-full"
        >
          {t("unauthenticated.form.submit")}
        </SubmitButton>
        <div className="mt-4">
          <Turnstile
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
            onSuccess={(token) => {
              setCaptchaToken(token);
            }}
          />
        </div>
      </form>
      {formMessage && <FormMessage message={formMessage} />}
    </div>
  );
}
