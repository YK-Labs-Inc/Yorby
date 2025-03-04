"use client";

import { FormMessage, Message } from "@/components/form-message";
import { usePathname, useSearchParams } from "next/navigation";
import { signInWithOTP } from "../actions";
import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";
import { useState } from "react";
import { Turnstile } from "@marsidev/react-turnstile";

export default function SignInForm() {
  const signInT = useTranslations("signIn");
  const searchParams = useSearchParams();
  const successMessage = searchParams.get("success") as string | undefined;
  const errorMessage = searchParams.get("error") as string | undefined;
  const message = searchParams.get("message") as string | undefined;
  const [captchaToken, setCaptchaToken] = useState<string>("");
  const pathname = usePathname();
  let formMessage: Message | undefined;
  if (successMessage) {
    formMessage = { success: successMessage };
  } else if (errorMessage) {
    formMessage = { error: errorMessage };
  } else if (message) {
    formMessage = { message: message };
  }

  return (
    <div className="container max-w-md mx-auto pt-20">
      <form action={signInWithOTP} className="space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">{signInT("title")}</h1>
          <p className="text-muted-foreground">{signInT("description")}</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{signInT("form.email.label")}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder={signInT("form.email.placeholder")}
              required
            />
          </div>
          <input type="hidden" name="captchaToken" value={captchaToken} />
          <input type="hidden" name="redirectTo" value={pathname} />
          <SubmitButton
            pendingText={signInT("form.submitting")}
            type="submit"
            className="w-full"
          >
            {signInT("form.submit")}
          </SubmitButton>
          {formMessage && <FormMessage message={formMessage} />}
        </div>
        <div className="mt-4">
          <Turnstile
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
            onSuccess={(token) => {
              setCaptchaToken(token);
            }}
          />
        </div>
      </form>
    </div>
  );
}
