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
import { useState, useActionState, useEffect } from "react";
import { ChevronLeft, Briefcase } from "lucide-react";
import { useTranslations } from "next-intl";
import { signInWithOTP, verifyOTP } from "@/app/(auth-pages)/actions";

export function CandidateAuthForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const searchParams = useSearchParams();
  const t = useTranslations("auth.candidateAuth");

  const redirectUrl = searchParams.get("redirect") ?? "/candidate-dashboard";

  const [state, formAction, isPending] = useActionState(signInWithOTP, null);

  const [otpState, otpFormAction, isOtpPending] = useActionState(
    verifyOTP,
    null
  );

  useEffect(() => {
    if (state?.success) {
      setStep("otp");
    }
  }, [state?.success]);

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Briefcase className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">
              {t("badge")}
            </span>
          </div>
          <CardTitle className="text-2xl">{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          {step === "email" ? (
            <form action={formAction}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">{t("email.label")}</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder={t("email.placeholder")}
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <input type="hidden" name="redirectTo" value={redirectUrl} />
                  <input type="hidden" name="captchaToken" value="" />
                </div>
                {state?.error && (
                  <p className="text-sm text-red-500">{state.error}</p>
                )}
                {state?.success && (
                  <div className="rounded-md bg-green-50 p-3">
                    <p className="text-sm text-green-800">{state.success}</p>
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? t("sending") : t("sendOtp")}
                </Button>
              </div>
            </form>
          ) : (
            <form action={otpFormAction}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="otp">{t("otp.label")}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t("otp.description", { email })}
                  </p>
                  <Input
                    id="otp"
                    name="token"
                    type="text"
                    placeholder={t("otp.placeholder")}
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                  <input type="hidden" name="email" value={email} />
                  <input type="hidden" name="redirectTo" value={redirectUrl} />
                </div>
                {otpState?.error && (
                  <p className="text-sm text-red-500">{otpState.error}</p>
                )}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isOtpPending}
                >
                  {isOtpPending ? t("verifying") : t("verify")}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setStep("email");
                    setOtp("");
                  }}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  {t("backToEmail")}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
      <div className="text-center text-sm text-muted-foreground">
        {t("organizationPrompt")}{" "}
        <Link
          href="/auth/login"
          className="text-primary underline underline-offset-4 hover:text-primary/80"
        >
          {t("organizationLink")}
        </Link>
      </div>
    </div>
  );
}
