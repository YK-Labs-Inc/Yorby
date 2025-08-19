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
import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { Turnstile } from "@marsidev/react-turnstile";
import { handleSignUp } from "@/components/auth/actions";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [captchaToken, setCaptchaToken] = useState<string>("");
  const t = useTranslations("auth.signUp");
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect");
  const email = searchParams.get("email");

  const [state, formAction, isPending] = useActionState(handleSignUp, {
    error: null,
  });

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{t("recruitingTitle")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
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
                  defaultValue={email || undefined}
                  readOnly={!!email}
                  className={email ? "cursor-not-allowed" : ""}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">{t("password.label")}</Label>
                </div>
                <Input id="password" name="password" type="password" required />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="repeat-password">
                    {t("repeatPassword.label")}
                  </Label>
                </div>
                <Input
                  id="repeat-password"
                  name="repeatPassword"
                  type="password"
                  required
                />
              </div>
              {state.error && (
                <p className="text-sm text-red-500">{state.error}</p>
              )}
              <input type="hidden" name="captchaToken" value={captchaToken} />
              <input
                type="hidden"
                name="redirectUrl"
                value={redirectUrl || ""}
              />
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
                disabled={isPending || !captchaToken}
              >
                {isPending ? t("submitting") : t("submit")}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              {t("hasAccount")}{" "}
              <Link
                href={`/auth/login${searchParams.toString() ? `?${searchParams.toString()}` : ""}`}
                className="underline underline-offset-4"
              >
                {t("loginLink")}
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="text-center text-sm text-muted-foreground">
        {t("candidateAccountPrompt")}{" "}
        <Link
          href="/auth/candidate-auth"
          className="text-primary underline underline-offset-4 hover:text-primary/80"
        >
          {t("candidateAccountLink")}
        </Link>
      </div>
    </div>
  );
}
