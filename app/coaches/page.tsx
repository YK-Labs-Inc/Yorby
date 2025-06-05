"use client";

import { FormMessage, Message } from "@/components/form-message";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";
import { useActionState, useEffect, useState } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import { signInWithOTP } from "../(auth-pages)/actions";
import { H2, P, H4 } from "@/components/typography";
import { usePostHog } from "posthog-js/react";

export default function CoachesPage() {
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
      posthog.capture("coaches_sign_in", {
        $current_url: url,
      });
    }
  }, [state]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-xl mx-auto pt-20">
        <div className="flex flex-col items-center gap-2 mb-8">
          <H2 className="text-4xl font-bold tracking-tight text-center">
            Yorby
          </H2>
          <H4 className="text-xl font-medium text-center text-muted-foreground mb-2">
            AI Coaching Platform For Career Coaches
          </H4>
          <P className="text-center text-lg text-muted-foreground mb-4">
            Yorby empowers career coaches to scale their impact by creating AI
            avatars of themselves and their knowledge. Build question banks, run
            mock interviews, and let your students practice and get
            feedback—powered by your expertise, delivered by AI.
          </P>
        </div>

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
            <input type="hidden" name="redirectTo" value={"/coaches/auth"} />
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
    </div>
  );
}
