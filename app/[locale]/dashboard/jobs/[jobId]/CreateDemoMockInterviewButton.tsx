"use client";

import { useActionState, useEffect } from "react";
import { startMockInterview } from "./actions";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export default function CreateDemoMockInterviewButton({
  jobId,
}: {
  jobId: string;
}) {
  const t = useTranslations("mockInterview");
  const [startInterviewState, startInterviewAction, startInterviewIsPending] =
    useActionState(startMockInterview, {
      error: "",
    });

  useEffect(() => {
    if (startInterviewState.error) {
      alert(startInterviewState.error);
    }
  }, [startInterviewState]);
  return (
    <form action={startInterviewAction}>
      <input type="hidden" name="jobId" value={jobId} />
      <input type="hidden" name="onboarding" value="true" />
      <Button disabled={startInterviewIsPending}>
        {startInterviewIsPending ? t("starting") : t("startNewInterview")}
      </Button>
    </form>
  );
}
