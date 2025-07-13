import MockInterviewReviewV2 from "@/app/dashboard/jobs/[jobId]/mockInterviews/[mockInterviewId]/review/v2/MockInterviewReviewV2";

export default async function MockInterviewReviewV2Page({
  params,
}: {
  params: Promise<{ mockInterviewId: string }>;
}) {
  const mockInterviewId = (await params).mockInterviewId;
  return <MockInterviewReviewV2 mockInterviewId={mockInterviewId} />;
}
