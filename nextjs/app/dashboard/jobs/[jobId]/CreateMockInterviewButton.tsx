"use client";

import { useActionState, useEffect } from "react";
import { startMockInterview } from "./actions";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { useMultiTenant } from "@/app/context/MultiTenantContext";

export default function CreateMockInterviewButton({
  jobId,
  livekitEnabled,
}: {
  jobId: string;
  livekitEnabled: boolean;
}) {
  const t = useTranslations("mockInterview");
  const [startInterviewState, startInterviewAction, startInterviewIsPending] =
    useActionState(startMockInterview, {
      error: "",
    });
  const { baseUrl } = useMultiTenant();
  const mockInterviewsPath = `${baseUrl}/${jobId}/mockInterviews`;
  useEffect(() => {
    if (startInterviewState.error) {
      alert(startInterviewState.error);
    }
  }, [startInterviewState]);
  return (
    <form action={startInterviewAction}>
      <input type="hidden" name="jobId" value={jobId} />
      <input
        type="hidden"
        name="mockInterviewsPath"
        value={mockInterviewsPath}
      />
      <input
        type="hidden"
        name="livekitEnabled"
        value={livekitEnabled ? "true" : "false"}
      />
      <Button disabled={startInterviewIsPending}>
        {startInterviewIsPending ? t("starting") : t("startNewInterview")}
      </Button>
    </form>
  );
}
