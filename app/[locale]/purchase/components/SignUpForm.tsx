"use client";

import { FormMessage, Message } from "@/components/form-message";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";
import { signInWithOTP } from "@/app/[locale]/(auth-pages)/actions";
import { useTranslations } from "next-intl";
import { usePathname, useSearchParams } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Turnstile } from "@marsidev/react-turnstile";
import { useState } from "react";

export default function SignUpForm() {
  const t = useTranslations("purchase");
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [captchaToken, setCaptchaToken] = useState<string>("");
  const successMessage = searchParams.get("success") as string | undefined;
  const errorMessage = searchParams.get("error") as string | undefined;
  const message = searchParams.get("message") as string | undefined;

  let formMessage: Message | undefined;
  if (successMessage) {
    formMessage = { success: successMessage };
  } else if (errorMessage) {
    formMessage = { error: errorMessage };
  } else if (message) {
    formMessage = { message: message };
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">{t("unauthenticated.title")}</h1>
        <p className="text-muted-foreground">
          {t("unauthenticated.description")}
        </p>
      </div>

      <form action={signInWithOTP} className="space-y-4">
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
