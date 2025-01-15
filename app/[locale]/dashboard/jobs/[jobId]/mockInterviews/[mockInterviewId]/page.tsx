export default async function ({
  params,
}: {
  params: Promise<{ jobId: string; mockInterviewId: string }>;
}) {
  const { mockInterviewId } = await params;
  return (
    <div>
      <h1>Mock Interview: {mockInterviewId}</h1>
    </div>
  );
}
