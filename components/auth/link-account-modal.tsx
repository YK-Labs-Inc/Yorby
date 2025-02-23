"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";
import { FormMessage, Message } from "@/components/form-message";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useState } from "react";
import { linkAnonymousAccount } from "./actions";
import { Button } from "../ui/button";

export function LinkAccountModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState<Message>();
  const t = useTranslations("accountLinking");
  const [state, action, pending] = useActionState(linkAnonymousAccount, {
    error: "",
  });

  useEffect(() => {
    if (state.error) {
      setMessage({ error: state.error });
    } else if (state.success) {
      setMessage({ success: state.success });
    }
  }, [state]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">{t("signUp")}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>
        {(!message || "error" in message) && (
          <>
            <p className="text-muted-foreground">{t("description")}</p>
            <form action={action} className="space-y-4">
              <Input
                id="email"
                name="email"
                type="email"
                placeholder={t("form.email.placeholder")}
                required
              />
              <SubmitButton disabled={pending} type="submit">
                {t("form.submit")}
              </SubmitButton>
            </form>
          </>
        )}
        {message && <FormMessage message={message} />}
      </DialogContent>
    </Dialog>
  );
}
