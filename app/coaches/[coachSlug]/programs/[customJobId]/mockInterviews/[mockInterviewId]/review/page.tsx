import MockInterviewReview from "@/app/dashboard/jobs/[jobId]/mockInterviews/[mockInterviewId]/review/MockInterviewReview";

export default async function MockInterviewReviewPage({
  params,
}: {
  params: Promise<{ mockInterviewId: string }>;
}) {
  const mockInterviewId = (await params).mockInterviewId;
  return <MockInterviewReview mockInterviewId={mockInterviewId} />;
}
