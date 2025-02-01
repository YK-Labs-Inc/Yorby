export default async function InterviewCopilotSessionPage({
  params,
}: {
  params: Promise<{ interviewCopilotId: string }>;
}) {
  const { interviewCopilotId } = await params;
  return <div>InterviewCopilotSessionPage</div>;
}
