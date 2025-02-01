export default async function InterviewCopilotSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  return <div>InterviewCopilotSessionPage</div>;
}
