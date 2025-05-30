import MockInterviewReview from "./MockInterviewReview";

export default async function MockInterviewReviewPage({
  params,
}: {
  params: Promise<{ mockInterviewId: string }>;
}) {
  const mockInterviewId = (await params).mockInterviewId;
  return <MockInterviewReview mockInterviewId={mockInterviewId} />;
}
