import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Session } from "./components/session";
import { redirect } from "next/navigation";

const fetchInterviewCopilotStatus = async (interviewCopilotId: string) => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("interview_copilots")
    .select("status")
    .eq("id", interviewCopilotId)
    .single();
  if (error) {
    throw new Error(error.message);
  }
  return { status: data.status };
};
export default async function OnDeviceSessionPage({
  params,
}: {
  params: Promise<{ interviewCopilotId: string }>;
}) {
  const { interviewCopilotId } = await params;
  const { status } = await fetchInterviewCopilotStatus(interviewCopilotId);
  console.log("status", status);
  if (status === "complete") {
    redirect(`/dashboard/interview-copilots/${interviewCopilotId}/review`);
  }
  return <Session interviewCopilotId={interviewCopilotId} />;
}
