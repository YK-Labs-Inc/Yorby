"use client";

import { FormMessage, Message } from "@/components/form-message";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";
import { useActionState, useEffect, useState } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import { signInWithOTP, verifyOTP } from "../../(candidate-auth-pages)/actions";
import { usePostHog } from "posthog-js/react";
import { Button } from "@/components/ui/button";

type AuthPhase = "email" | "otp";

export default function SignInForm() {
  const signInT = useTranslations("signIn");
  const authT = useTranslations("auth.candidateAuth");
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
  const posthog = usePostHog();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
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
      let url = window.origin + pathname;
      if (searchParams && searchParams.toString()) {
        url = url + `?${searchParams.toString()}`;
      }
      posthog.capture("landing_page_magic_link_entered", {
        $current_url: url,
      });
    }
  }, [emailState, pathname, searchParams, posthog]);

  return (
    <div className="container max-w-md mx-auto">
      {phase === "email" ? (
        // Email submission form
        <form action={emailAction} className="space-y-6" data-phase="email">
          <div className="space-y-2 text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              {signInT("enterEmailToGetStarted")}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              {signInT("description")}
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{authT("email.label")}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder={signInT("form.email.placeholder")}
                required
                className="bg-background"
              />
            </div>
            <input type="hidden" name="captchaToken" value={captchaToken} />
            <input type="hidden" name="redirectTo" value="/onboarding" />
            <SubmitButton
              disabled={!captchaToken || emailPending}
              pendingText={authT("sending")}
              type="submit"
              className="w-full"
            >
              {authT("sendOtp")}
            </SubmitButton>
            <p className="text-xs sm:text-sm text-muted-foreground text-center">
              {signInT("autoCreateAccount")}
            </p>
            {formMessage && <FormMessage message={formMessage} />}
          </div>
          <div className="mt-4 flex justify-center">
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
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              {authT("otp.title", { defaultValue: "Enter verification code" })}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              {authT("otp.description", { email: emailState.email })}
            </p>
          </div>

          <div className="space-y-4">
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
            <input type="hidden" name="redirectTo" value="/onboarding" />
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
          </div>
        </form>
      )}
    </div>
  );
}
