"use client";
import { Turnstile } from "@marsidev/react-turnstile";
import { Tables } from "@/utils/supabase/database.types";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { cloneDemoJob } from "./actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface Props {
  demoJob: Tables<"demo_jobs">;
}

export default function CloneDemoJobClientComponent({ demoJob }: Props) {
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const [state, action, pending] = useActionState(cloneDemoJob, {
    error: "",
  });
  const t = useTranslations("jobCreation");

  return (
    <>
      <div className="max-w-2xl mx-auto p-6 space-y-8">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-center">
            {demoJob.job_title}
          </h1>
          {demoJob.company_name && (
            <h2 className="text-xl text-gray-700 dark:text-gray-300 text-center">
              {demoJob.company_name}
            </h2>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">
            {t("cloneDemoJob.description")}
          </p>

          <div className="space-y-4 flex flex-col items-center w-full">
            <Turnstile
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
              onSuccess={(token) => setTurnstileToken(token)}
              className="mb-4"
            />

            <form action={action}>
              <input type="hidden" name="demoJobId" value={demoJob.id} />
              <input type="hidden" name="captchaToken" value={turnstileToken} />
              <Button className="w-full" disabled={!turnstileToken || pending}>
                {pending ? t("cloneDemoJob.loading") : t("cloneDemoJob.button")}
              </Button>
            </form>

            {state?.error && (
              <div className="text-red-600 dark:text-red-400 text-sm">
                {state.error}
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("loading.title")}</DialogTitle>
            <DialogDescription>{t("loading.description")}</DialogDescription>
            <p className="text-sm text-muted-foreground">
              {t("loading.redirect")}
            </p>
          </DialogHeader>
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </DialogContent>
      </Dialog>
    </>
  );
}
