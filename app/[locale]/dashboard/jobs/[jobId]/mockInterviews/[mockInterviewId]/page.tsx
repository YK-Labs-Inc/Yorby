import MockInterview from "./MockInterview";

export default async function MockInterviewPage({
  params,
}: {
  params: Promise<{ jobId: string; mockInterviewId: string }>;
}) {
  const jobId = (await params).jobId;
  const mockInterviewId = (await params).mockInterviewId;
  return <MockInterview jobId={jobId} mockInterviewId={mockInterviewId} />;
}
