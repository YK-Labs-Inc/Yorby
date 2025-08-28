"use client";

import { FormMessage, Message } from "@/components/form-message";
import { signInWithOTP, verifyOTP } from "../actions";
import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";
import { useActionState, useState, useEffect } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import { useMultiTenant } from "@/app/context/MultiTenantContext";
import { Button } from "@/components/ui/button";

interface SignInFormProps {
  redirectUrl?: string;
}

type AuthPhase = "email" | "otp";

export default function SignInForm({ redirectUrl }: SignInFormProps = {}) {
  const signInT = useTranslations("auth.candidateAuth");
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
  const { isYorbyCoaching } = useMultiTenant();

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
    <div>
      {phase === "email" ? (
        // Email submission form
        <form action={emailAction} className="space-y-6" data-phase="email">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
            <p className="text-muted-foreground">{signInT("description")}</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{signInT("email.label")}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder={signInT("email.placeholder")}
                required
                className="bg-background"
              />
            </div>
            <input type="hidden" name="captchaToken" value={captchaToken} />
            <input
              type="hidden"
              name="redirectTo"
              value={redirectUrl || (isYorbyCoaching ? "/coaches/auth" : "")}
            />
            <SubmitButton
              disabled={!captchaToken || emailPending}
              pendingText={signInT("sending")}
              type="submit"
              className="w-full"
            >
              {signInT("sendOtp")}
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
      ) : (
        // OTP verification form
        <form action={otpAction} className="space-y-6" data-phase="otp">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold text-foreground">
              Enter verification code
            </h2>
            <p className="text-muted-foreground">
              {signInT("otp.description", { email: emailState.email })}
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token">{signInT("otp.label")}</Label>
              <Input
                id="token"
                name="token"
                type="text"
                placeholder={signInT("otp.placeholder")}
                required
                className="bg-background text-center text-2xl tracking-wider"
                maxLength={6}
                pattern="[0-9]{6}"
                autoComplete="one-time-code"
                autoFocus
              />
            </div>
            <input type="hidden" name="email" value={emailState.email} />
            <input
              type="hidden"
              name="redirectTo"
              value={redirectUrl || (isYorbyCoaching ? "/coaches/auth" : "")}
            />
            <SubmitButton
              disabled={otpPending}
              pendingText={signInT("verifying")}
              type="submit"
              className="w-full bg-[hsl(var(--chart-2))] hover:bg-[hsl(var(--chart-2)/0.9)] text-white"
            >
              {signInT("verify")}
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
              {signInT("backToEmail")}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
