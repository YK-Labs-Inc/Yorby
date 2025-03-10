"use client";

import { AIButton } from "@/components/ai-button";
import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { verifyAnonymousUser } from "../dashboard/resumes/actions";
import { Turnstile } from "@marsidev/react-turnstile";
import { FormMessage } from "@/components/form-message";
import { User } from "@supabase/supabase-js";
import Link from "next/link";

export default function CTA({ user }: { user: User | null }) {
  const t = useTranslations("resumeBuilder.landingPage");
  const [captchaToken, setCaptchaToken] = useState<string>("");
  const [state, action, pending] = useActionState(verifyAnonymousUser, {
    error: "",
  });
  return user ? (
    <Link href="/dashboard/resumes">
      <AIButton pending={pending} pendingText={t("ctaPending")} size="lg">
        {t("cta")}
      </AIButton>
    </Link>
  ) : (
    <form action={action}>
      <input type="hidden" name="captchaToken" value={captchaToken} />
      <AIButton pending={pending} pendingText={t("ctaPending")} size="lg">
        {t("cta")}
      </AIButton>
      <div className="flex justify-center mt-4">
        <Turnstile
          siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
          onSuccess={(token) => {
            setCaptchaToken(token);
          }}
        />
      </div>
      {state?.error && <FormMessage message={{ error: state.error }} />}
    </form>
  );
}
