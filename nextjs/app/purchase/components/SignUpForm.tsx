"use client";

import { FormMessage, Message } from "@/components/form-message";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";
import { signInWithOTP, verifyOTP } from "@/app/(candidate-auth-pages)/actions";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Turnstile } from "@marsidev/react-turnstile";
import { useActionState, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

type AuthPhase = "email" | "otp";

export default function SignUpForm() {
  const t = useTranslations("purchase");
  const authT = useTranslations("auth.candidateAuth");
  const pathname = usePathname();
  const [phase, setPhase] = useState<AuthPhase>("email");

  // State for email submission
  const [emailState, emailAction, emailPending] = useActionState(
    signInWithOTP,
    {
      success: false,
      email: "",
      error: "",
    }
  );

  // State for OTP verification
  const [otpState, otpAction, otpPending] = useActionState(verifyOTP, {
    error: "",
  });

  const [captchaToken, setCaptchaToken] = useState<string>("");

  // Determine which form message to show based on current phase
  let formMessage: Message | undefined;
  if (phase === "email") {
    if (emailState.error) {
      formMessage = { error: emailState.error };
    }
  } else {
    if (otpState.error) {
      formMessage = { error: otpState.error };
    }
  }

  // Effect to handle successful email submission
  useEffect(() => {
    if (emailState.success) {
      setPhase("otp");
    }
  }, [emailState]);

  return (
    <div className="space-y-6">
      {phase === "email" ? (
        // Email submission form
        <>
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold">{t("unauthenticated.title")}</h1>
            <p className="text-muted-foreground">
              {t("unauthenticated.description")}
            </p>
          </div>

          <form action={emailAction} className="space-y-4" data-phase="email">
            <div className="space-y-2">
              <Label htmlFor="email">{t("unauthenticated.form.email.label")}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder={t("unauthenticated.form.email.placeholder")}
                required
                className="bg-background"
              />
            </div>
            <input type="hidden" name="captchaToken" value={captchaToken} />
            {pathname && <input type="hidden" name="redirectTo" value={pathname} />}
            <SubmitButton
              pendingText={authT("sending")}
              disabled={!captchaToken || emailPending}
              type="submit"
              className="w-full"
            >
              {authT("sendOtp")}
            </SubmitButton>
            {formMessage && <FormMessage message={formMessage} />}
            <div className="mt-4 flex justify-center">
              <Turnstile
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                onSuccess={(token) => {
                  setCaptchaToken(token);
                }}
              />
            </div>
          </form>
        </>
      ) : (
        // OTP verification form
        <>
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold">
              {authT("otp.title", { defaultValue: "Enter verification code" })}
            </h1>
            <p className="text-muted-foreground">
              {authT("otp.description", { email: emailState.email })}
            </p>
          </div>

          <form action={otpAction} className="space-y-4" data-phase="otp">
            <div className="space-y-2">
              <Label htmlFor="token">{authT("otp.label")}</Label>
              <Input
                id="token"
                name="token"
                type="text"
                placeholder={authT("otp.placeholder")}
                required
                className="bg-background text-center text-2xl tracking-wider"
                maxLength={6}
                pattern="[0-9]{6}"
                autoComplete="one-time-code"
                autoFocus
              />
            </div>
            <input type="hidden" name="email" value={emailState.email} />
            {pathname && <input type="hidden" name="redirectTo" value={pathname} />}
            <SubmitButton
              disabled={otpPending}
              pendingText={authT("verifying")}
              type="submit"
              className="w-full bg-[hsl(var(--chart-2))] hover:bg-[hsl(var(--chart-2)/0.9)] text-white"
            >
              {authT("verify")}
            </SubmitButton>
            {formMessage && <FormMessage message={formMessage} />}
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setPhase("email");
              }}
            >
              {authT("backToEmail")}
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
