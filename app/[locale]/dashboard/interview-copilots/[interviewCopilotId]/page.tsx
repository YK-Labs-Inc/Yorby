import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Logger } from "next-axiom";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import EditableInterviewCopilot from "./EditableInterviewCopilot";
import { redirect } from "next/navigation";
const fetchInterviewCopilot = async (interviewCopilotId: string) => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("interview_copilots")
    .select("*, interview_copilot_files(*)")
    .eq("id", interviewCopilotId)
    .single();
  if (error) {
    const logger = new Logger().with({
      function: "fetchInterviewCopilot",
    });
    logger.error("Error fetching interview copilot", { error });
    await logger.flush();
    return { data: null };
  }
  return { data };
};

export default async function Page({
  params,
}: {
  params: Promise<{ interviewCopilotId: string }>;
}) {
  const { interviewCopilotId } = await params;
  const { data: interviewCopilot } =
    await fetchInterviewCopilot(interviewCopilotId);
  const t = await getTranslations("interviewCopilots");

  if (interviewCopilot?.status === "complete") {
    redirect(`/dashboard/interview-copilots/${interviewCopilotId}/review`);
  }

  if (!interviewCopilot) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">
            {t("errors.notFound.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("errors.notFound.description")}
          </p>
          <div className="pt-4">
            <Link href="/dashboard/interview-copilots">
              <Button>{t("errors.notFound.action")}</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <EditableInterviewCopilot interviewCopilot={interviewCopilot} />
      </div>
    </div>
  );
}
