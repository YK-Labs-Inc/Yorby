"use client";

import { signInWithOTP } from "@/app/[locale]/(auth-pages)/actions";
import { FormMessage } from "@/components/form-message";
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
import { usePathname } from "next/navigation";

interface AuthModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthModal({ isOpen, onOpenChange }: AuthModalProps) {
  const pathname = usePathname();
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sign in to Perfect Interview</DialogTitle>
          <DialogDescription>
            Enter your email to receive a magic link for instant access.
          </DialogDescription>
        </DialogHeader>
        <form action={signInWithOTP} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              name="email"
              type="email"
              placeholder="you@example.com"
              required
            />
          </div>
          <input type="hidden" name="redirectTo" value={pathname} />
          <SubmitButton pendingText="Sending magic link..." type="submit">
            Send Magic Link
          </SubmitButton>
          <FormMessage />
        </form>
      </DialogContent>
    </Dialog>
  );
}
