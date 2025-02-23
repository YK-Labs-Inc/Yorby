"use client";

import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";
import { FormMessage, Message } from "@/components/form-message";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useState } from "react";
import { linkAnonymousAccount } from "@/components/auth/actions";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function SignUpPage() {
  const [message, setMessage] = useState<Message>();
  const t = useTranslations("accountLinking");
  const signUpT = useTranslations("signUp");
  const router = useRouter();
  const [state, action, pending] = useActionState(linkAnonymousAccount, {
    error: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setIsAuthenticated(!!user?.email);
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (state.error) {
      setMessage({ error: state.error });
    } else if (state.success) {
      setMessage({ success: state.success });
    }
  }, [state]);

  if (isLoading) {
    return (
      <div className="container max-w-md mx-auto pt-20">
        <div className="text-center">{signUpT("loading")}</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="container max-w-md mx-auto pt-20">
        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold">
              {signUpT("alreadySignedIn.title")}
            </h1>
            <p className="text-muted-foreground">
              {signUpT("alreadySignedIn.description")}
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <Button
              onClick={() => router.push("/dashboard/jobs")}
              className="w-full"
            >
              {signUpT("alreadySignedIn.buttons.dashboard")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-md mx-auto pt-20">
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          {(!message || "error" in message) && (
            <p className="text-muted-foreground">{t("description")}</p>
          )}
        </div>

        {(!message || "error" in message) && (
          <form action={action} className="space-y-4">
            <Input
              id="email"
              name="email"
              type="email"
              placeholder={t("form.email.placeholder")}
              required
            />
            <SubmitButton disabled={pending} type="submit" className="w-full">
              {t("form.submit")}
            </SubmitButton>
          </form>
        )}
        {message && <FormMessage message={message} />}
      </div>
    </div>
  );
}
