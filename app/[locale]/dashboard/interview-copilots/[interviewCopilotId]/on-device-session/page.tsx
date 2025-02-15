import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Session } from "./components/session";
import { redirect } from "next/navigation";
import { Logger } from "next-axiom";
import { getTranslations } from "next-intl/server";

const fetchInterviewCopilotStatus = async (interviewCopilotId: string) => {
  const supabase = await createSupabaseServerClient();
  const logger = new Logger().with({ interviewCopilotId });
  const { data, error } = await supabase
    .from("interview_copilots")
    .select("status")
    .eq("id", interviewCopilotId)
    .single();
  if (error) {
    const t = await getTranslations("errors");
    logger.error("Error fetching interview copilot status", { error });
    await logger.flush();
    return { error: t("pleaseTryAgain") };
  }
  return { status: data.status };
};
export default async function OnDeviceSessionPage({
  params,
}: {
  params: Promise<{ interviewCopilotId: string }>;
}) {
  const { interviewCopilotId } = await params;
  const { error, status } =
    await fetchInterviewCopilotStatus(interviewCopilotId);
  if (status === "complete") {
    redirect(`/dashboard/interview-copilots/${interviewCopilotId}/review`);
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 min-h-screen flex flex-col justify-center items-center">
        <div className="max-w-md mx-auto text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">{error}</h1>
        </div>
      </div>
    );
  }

  return <Session interviewCopilotId={interviewCopilotId} />;
}
