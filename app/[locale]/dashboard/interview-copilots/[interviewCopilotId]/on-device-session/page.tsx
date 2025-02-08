import { AssemblyAI } from "assemblyai";
import { Session } from "./components/session";

export default async function OnDeviceSessionPage({
  params,
}: {
  params: Promise<{ interviewCopilotId: string }>;
}) {
  const { interviewCopilotId } = await params;

  return <Session interviewCopilotId={interviewCopilotId} />;
}
