import MockInterview from "@/app/dashboard/jobs/[jobId]/mockInterviews/[mockInterviewId]/MockInterview";

export default async function MockInterviewPage({
  params,
}: {
  params: Promise<{ customJobId: string; mockInterviewId: string }>;
}) {
  const customJobId = (await params).customJobId;
  const mockInterviewId = (await params).mockInterviewId;
  return (
    <MockInterview jobId={customJobId} mockInterviewId={mockInterviewId} />
  );
}
