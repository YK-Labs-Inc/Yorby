export default async function MockInterviewReviewPage({
  params,
}: {
  params: Promise<{ jobId: string; mockInterviewId: string }>;
}) {
  const jobId = (await params).jobId;
  const mockInterviewId = (await params).mockInterviewId;
  return (
    <div>
      <h1>Mock Interview Review</h1>
      <p>Job ID: {jobId}</p>
      <p>Mock Interview ID: {mockInterviewId}</p>
    </div>
  );
}
