"use client";

import { Suspense, useState } from "react";
import { useActionState } from "react";
import { signUpToWaitlist } from "./actions";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";
import { useTranslations } from "next-intl";

const WaitlistComponent = () => {
  const t = useTranslations("waitlist");
  const [state, formAction, pending] = useActionState(signUpToWaitlist, {
    status: "",
  });
  const [email, setEmail] = useState("");

  const searchParams = useSearchParams();
  const signedUp = searchParams.get("signed_up") === "true";

  if (signedUp) {
    return (
      <main className="flex flex-col gap-6 px-4">
        <h1 className="text-4xl font-bold tracking-tight text-center">
          {t("thankYou.title")}
        </h1>
        <p className="text-lg text-foreground/60 text-center">
          {t("thankYou.message")}
        </p>
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-6 px-4">
      <h1 className="text-4xl font-bold tracking-tight text-center">
        {t("title")}
      </h1>
      <p className="text-lg text-foreground/60 text-center">{t("subtitle")}</p>
      <form className="flex flex-col gap-2 text-center" action={formAction}>
        <p className="text-lg text-foreground/60">{t("form.description")}</p>
        <p className="text-sm text-foreground/60">
          {t("form.discountMessage")}
        </p>
        <Input
          name="email"
          placeholder={t("form.emailPlaceholder")}
          type="email"
          onChange={(e) => setEmail(e.target.value)}
        />
        <SubmitButton disabled={pending || !email}>
          {pending
            ? t("form.submitButton.pending")
            : t("form.submitButton.default")}
        </SubmitButton>
        {state.status === "error" && (
          <p className="text-sm text-red-500">{t("form.error")}</p>
        )}
      </form>
    </main>
  );
};

export default function Page() {
  return (
    <Suspense>
      <WaitlistComponent />
    </Suspense>
  );
}
