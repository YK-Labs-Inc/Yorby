export default async function JobPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const jobId = (await params).jobId;
  return <div>{jobId}</div>;
}
