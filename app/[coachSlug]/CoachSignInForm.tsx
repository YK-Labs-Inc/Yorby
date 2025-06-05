"use client";

import { FormMessage, Message } from "@/components/form-message";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";
import { useActionState, useEffect, useState } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import { signInWithOTP } from "@/app/(auth-pages)/actions";
import { H4 } from "@/components/typography";
import { usePostHog } from "posthog-js/react";

export default function CoachSignInForm({ coachId }: { coachId: string }) {
  const signInT = useTranslations("signIn");
  const [state, action, pending] = useActionState(signInWithOTP, {
    success: "",
    error: undefined,
  });
  const [captchaToken, setCaptchaToken] = useState<string>("");
  const [showCaptcha, setShowCaptcha] = useState<boolean>(true);
  const posthog = usePostHog();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  let formMessage: Message | undefined;
  if (state.success) {
    formMessage = { success: state.success };
  } else if (state.error) {
    formMessage = { error: state.error };
  }

  useEffect(() => {
    if (state.success) {
      let url = window.origin + pathname;
      if (searchParams && searchParams.toString()) {
        url = url + `?${searchParams.toString()}`;
      }
      posthog.capture("register_for_coach_curriculum", {
        $current_url: url,
        coach_id: coachId,
      });
    }
  }, [state]);

  return (
    <div className="container max-w-md mx-auto">
      <form action={action} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <H4 className="text-lg font-semibold text-center">
              {signInT("enterEmailToGetStarted")}
            </H4>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder={signInT("form.email.placeholder")}
              required
            />
          </div>
          <input type="hidden" name="captchaToken" value={captchaToken} />
          <input
            type="hidden"
            name="redirectTo"
            value={`/api/coach/${coachId}/register`}
          />
          <SubmitButton
            disabled={!captchaToken || pending}
            pendingText={signInT("form.submitting")}
            type="submit"
            className="w-full"
          >
            {signInT("form.getStarted")}
          </SubmitButton>
          <p className="text-muted-foreground text-center">
            {signInT("description")}
          </p>
          <p className="text-sm text-muted-foreground text-center">
            {signInT("autoCreateAccount")}
          </p>
          {formMessage && <FormMessage message={formMessage} />}
        </div>
        <div className={`mt-4 ${showCaptcha ? "" : "hidden"}`}>
          <Turnstile
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
            onSuccess={(token) => {
              setCaptchaToken(token);
              setShowCaptcha(false);
            }}
          />
        </div>
      </form>
    </div>
  );
}
