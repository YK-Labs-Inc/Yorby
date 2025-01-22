"use client";

import { AIButton } from "@/components/ai-button";
import { useTranslations } from "next-intl";
import { generateMoreQuestions } from "./actions";
import { useActionState, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import React from "react";

export function GenerateInterviewQuestionsButton({ jobId }: { jobId: string }) {
  const t = useTranslations("jobCreation");
  const jobPageT = useTranslations("jobPage");
  const [open, setOpen] = useState(false);
  const [_, action, pending] = useActionState(generateMoreQuestions, undefined);

  useEffect(() => {
    if (!pending && open) {
      setOpen(false);
    } else if (pending) {
      setOpen(true);
    }
  }, [pending, open]);

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        // Only allow opening, prevent manual closing
        if (isOpen) setOpen(true);
      }}
    >
      <DialogTrigger asChild>
        <form action={action}>
          <input type="hidden" name="jobId" value={jobId} />
          <AIButton
            type="submit"
            disabled={pending}
            pending={pending}
            pendingText={jobPageT("generatingQuestions")}
          >
            {jobPageT("generateQuestions")}
          </AIButton>
        </form>
      </DialogTrigger>
      <DialogContent className="[&>button]:hidden">
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
  );
}
