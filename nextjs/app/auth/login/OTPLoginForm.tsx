"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Turnstile } from "@marsidev/react-turnstile";
import { signInWithOTP, verifyOTP } from "./actions";

type AuthPhase = "email" | "otp";

export default function OTPLoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [captchaToken, setCaptchaToken] = useState<string>("");
  const searchParams = useSearchParams();
  const t = useTranslations("auth.login");
  const redirectUrl = searchParams.get("redirect") || "/auth-redirect";
  const emailParam = searchParams.get("email");
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

  // Effect to handle successful email submission
  useEffect(() => {
    if (emailState.success) {
      setPhase("otp");
    }
  }, [emailState]);

  // Determine which error message to show based on current phase
  let errorMessage: string | undefined;
  if (phase === "email" && emailState.error) {
    errorMessage = emailState.error;
  } else if (phase === "otp" && otpState.error) {
    errorMessage = otpState.error;
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center lg:text-left">
          <CardTitle className="text-2xl">{t("recruitingTitle")}</CardTitle>
          <CardDescription>
            {phase === "email"
              ? t("description")
              : t("otp.verificationSent", { email: emailState.email })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {phase === "email" ? (
            // Email submission form
            <form action={emailAction}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">{t("email.label")}</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder={t("email.placeholder")}
                    required
                    defaultValue={emailParam || undefined}
                  />
                </div>
                {errorMessage && (
                  <p className="text-sm text-red-500">{errorMessage}</p>
                )}
                <input type="hidden" name="captchaToken" value={captchaToken} />
                <div className="flex justify-center">
                  <Turnstile
                    siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                    onSuccess={(token) => {
                      setCaptchaToken(token);
                    }}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={emailPending || !captchaToken}
                >
                  {emailPending ? t("otp.sendingCode") : t("otp.sendCode")}
                </Button>
              </div>
              {/* <div className="mt-4 text-center text-sm">
                {t("noAccount")}{" "}
                <Link
                  href={`/auth/sign-up${searchParams.toString() ? `?${searchParams.toString()}` : ""}`}
                  className="underline underline-offset-4"
                >
                  {t("signUpLink")}
                </Link>
              </div> */}
            </form>
          ) : (
            // OTP verification form
            <form action={otpAction}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="token">
                    {t("otp.verificationCodeLabel")}
                  </Label>
                  <Input
                    id="token"
                    name="token"
                    type="text"
                    placeholder={t("otp.verificationCodePlaceholder")}
                    required
                    className="text-center text-2xl tracking-wider"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    autoComplete="one-time-code"
                    autoFocus
                  />
                </div>
                {errorMessage && (
                  <p className="text-sm text-red-500">{errorMessage}</p>
                )}
                <input type="hidden" name="email" value={emailState.email} />
                <input type="hidden" name="redirectTo" value={redirectUrl} />
                <Button type="submit" className="w-full" disabled={otpPending}>
                  {otpPending ? t("otp.verifying") : t("otp.verifyCode")}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setPhase("email");
                  }}
                >
                  {t("otp.backToEmail")}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
