"use client";

import { useActionState, useEffect } from "react";
import { startMockInterview } from "./actions";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

export default function CreateMockInterviewButton({
  jobId,
}: {
  jobId: string;
}) {
  const t = useTranslations("mockInterview");
  const [startInterviewState, startInterviewAction, startInterviewIsPending] =
    useActionState(startMockInterview, {
      error: "",
    });
  const params = useParams();
  let mockInterviewsPath = "";
  if (params && "coachSlug" in params) {
    mockInterviewsPath = `/coaches/${params.coachSlug}/curriculum/${jobId}/mockInterviews`;
  } else {
    mockInterviewsPath = `/dashboard/jobs/${jobId}/mockInterviews`;
  }

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
      <Button disabled={startInterviewIsPending}>
        {startInterviewIsPending ? t("starting") : t("startNewInterview")}
      </Button>
    </form>
  );
}
