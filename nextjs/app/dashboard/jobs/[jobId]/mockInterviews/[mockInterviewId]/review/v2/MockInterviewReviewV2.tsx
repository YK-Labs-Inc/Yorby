"use client";

import useSWR from "swr";
import MockInterviewReviewClientComponentV2 from "./MockInterviewReviewClientComponentV2";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { getMockInterviewDataV2 } from "../../actions";

const MockInterviewReviewV2 = ({
  mockInterviewId,
}: {
  mockInterviewId: string;
}) => {
  const { logError, logInfo } = useAxiomLogging();

  const { data, error, isLoading } = useSWR(
    [`mock-interview-review-v2`, mockInterviewId],
    () => getMockInterviewDataV2(mockInterviewId),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      onSuccess: () => {
        logInfo("mock_interview_reviewed_v2", {
          mockInterviewId,
        });
      },
      onError: (err) => {
        logError("Failed to fetch mock interview data V2", { error: err });
      },
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
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500">
            Failed to load mock interview
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <MockInterviewReviewClientComponentV2
        mockInterview={data.mockInterview}
        messages={data.messages}
        feedback={data.feedback}
        questionFeedback={data.questionFeedback}
        muxMetadata={data.muxMetadata}
      />
    </div>
  );
};

export default MockInterviewReviewV2;