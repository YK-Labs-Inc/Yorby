"use client";

import { LiveKitInterviewComponent } from "@/app/dashboard/jobs/[jobId]/mockInterviews/[mockInterviewId]/v2/LiveKitInterviewComponent";
import { APP_CONFIG_DEFAULTS } from "@/app/dashboard/jobs/[jobId]/mockInterviews/[mockInterviewId]/v2/app-config";
import { use } from "react";

interface PageProps {
  params: Promise<{
    companyId: string;
    jobId: string;
    interviewId: string;
  }>;
}

export default function InterviewPage({ params }: PageProps) {
  const { companyId, jobId, interviewId } = use(params);

  return (
    <LiveKitInterviewComponent
      appConfig={APP_CONFIG_DEFAULTS}
      interviewType="real-interview"
      mockInterviewId={interviewId}
      jobId={jobId}
      companyId={companyId}
    />
  );
}
