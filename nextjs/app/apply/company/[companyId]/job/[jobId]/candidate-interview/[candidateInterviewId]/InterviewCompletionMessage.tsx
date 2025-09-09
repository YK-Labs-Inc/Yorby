"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useTranslations } from "next-intl";

export function InterviewCompletionMessage() {
  const tInterview = useTranslations("apply.candidateInterview");

  return (
    <>
      <p className="text-gray-600 mb-4">
        {tInterview("interviewProcessed.allComplete")}
      </p>
      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-900 font-semibold mb-2">
          {tInterview("interviewProcessed.prepareForMore")}
        </p>
        <p className="text-sm text-blue-700">
          {tInterview("interviewProcessed.practiceDescription")}
        </p>
      </div>
      <Button asChild>
        <Link href="/dashboard/jobs?newJob=true">
          {tInterview("buttons.practiceInterview")}
        </Link>
      </Button>
    </>
  );
}