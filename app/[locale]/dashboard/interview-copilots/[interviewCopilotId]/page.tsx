import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Logger } from "next-axiom";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import EditableInterviewCopilot from "./EditableInterviewCopilot";
import LockedInterviewCopilotComponent from "./LockedInterviewCopilotComponent";
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

const fetchUserCredits = async (userId: string) => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("custom_job_credits")
    .select("number_of_credits")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    throw error;
  }
  return data?.number_of_credits || 0;
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

  if (interviewCopilot?.deletion_status === "deleted") {
    redirect("/dashboard/interview-copilots");
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

  // Get user credits if the interview copilot is locked
  let userCredits = 0;
  if (interviewCopilot.interview_copilot_access === "locked") {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      userCredits = await fetchUserCredits(user.id);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {interviewCopilot.interview_copilot_access === "locked" ? (
          <LockedInterviewCopilotComponent
            interviewCopilot={interviewCopilot}
            userCredits={userCredits}
          />
        ) : (
          <EditableInterviewCopilot interviewCopilot={interviewCopilot} />
        )}
      </div>
    </div>
  );
}
