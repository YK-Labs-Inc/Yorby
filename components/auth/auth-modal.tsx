"use client";

import { signInWithOTP } from "@/app/[locale]/(auth-pages)/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Turnstile } from "@marsidev/react-turnstile";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";

interface AuthModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthModal({ isOpen, onOpenChange }: AuthModalProps) {
  const [captchaToken, setCaptchaToken] = useState<string>("");
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const authSuccess = searchParams?.get("authSuccess") as string | undefined;
  const authError = searchParams?.get("authError") as string | undefined;
  let formMessage: Message | undefined;
  if (authSuccess) {
    formMessage = { success: authSuccess };
  } else if (authError) {
    formMessage = { error: authError };
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md flex flex-col items-center w-full">
        <DialogHeader>
          <DialogTitle>Sign in to Perfect Interview</DialogTitle>
          <DialogDescription>
            Enter your email to receive a magic link for instant access.
          </DialogDescription>
        </DialogHeader>
        <form action={signInWithOTP} className="flex flex-col">
          <div className="flex flex-col gap-2 mb-4">
            <Label htmlFor="email">Email</Label>
            <Input
              name="email"
              type="email"
              placeholder="you@example.com"
              required
            />
          </div>
          <input type="hidden" name="redirectTo" value={pathname} />
          <input type="hidden" name="captchaToken" value={captchaToken} />
          <SubmitButton
            className="mt-4"
            pendingText="Sending magic link..."
            type="submit"
          >
            Send Magic Link
          </SubmitButton>
          {formMessage && <FormMessage message={formMessage} />}
          <div className="mt-4">
            <Turnstile
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
              onSuccess={(token) => {
                setCaptchaToken(token);
              }}
            />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
