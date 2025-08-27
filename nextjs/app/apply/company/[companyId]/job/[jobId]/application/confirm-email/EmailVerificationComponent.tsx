"use client";

import { verifyOTP } from "@/app/auth/login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@/context/UserContext";
import { useTranslations } from "next-intl";
import { useActionState } from "react";

export default function EmailVerificationComponent({
  redirectUrl,
}: {
  redirectUrl: string;
}) {
  const user = useUser();
  const t = useTranslations("auth.login");
  const [otpState, otpAction, otpPending] = useActionState(verifyOTP, {
    error: "",
  });
  if (!user) {
    return null;
  }
  return (
    <form action={otpAction}>
      <div className="flex flex-col gap-6">
        <div className="grid gap-2">
          <Label htmlFor="token">{t("otp.verificationCodeLabel")}</Label>
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
        {otpState.error && (
          <p className="text-sm text-red-500">{otpState.error}</p>
        )}
        <input type="hidden" name="email" value={user?.new_email} />
        <input type="hidden" name="redirectTo" value={redirectUrl} />
        <Button type="submit" className="w-full" disabled={otpPending}>
          {otpPending ? t("otp.verifying") : t("otp.verifyCode")}
        </Button>
      </div>
    </form>
  );
}
