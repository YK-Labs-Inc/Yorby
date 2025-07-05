"use client";

import useSWR from "swr";
import { useTranslations } from "next-intl";
import { getMockInterviewDetails } from "@/app/dashboard/coach-admin/actions";
import MockInterviewReview from "@/app/dashboard/jobs/[jobId]/mockInterviews/[mockInterviewId]/review/MockInterviewReview";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface MockInterviewViewProps {
  interviewId: string;
  locale: string;
}

export default function MockInterviewView({
  interviewId,
  locale,
}: MockInterviewViewProps) {
  const t = useTranslations("AdminStudentMockInterviewView");

  const { data, error, isLoading } = useSWR(
    [`mock-interview-details`, interviewId],
    () => getMockInterviewDetails(interviewId),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-600 text-lg">{t("errorLoadingInterview")}</p>
      </div>
    );
  }

  return (
    <div className="h-full">
      <MockInterviewReview mockInterviewId={interviewId} />
    </div>
  );
}
