import { createSupabaseServerClient } from "@/utils/supabase/server";
import InterviewCopilotReviewClientComponent from "./InterviewCopilotReviewClientComponent";
import { redirect } from "next/navigation";
import { Logger } from "next-axiom";
import { getTranslations } from "next-intl/server";

const fetchInterviewCopilotStatus = async (interviewCopilotId: string) => {
  const supabase = await createSupabaseServerClient();
  const logger = new Logger().with({ interviewCopilotId });
  const { data, error } = await supabase
    .from("interview_copilots")
    .select("deletion_status")
    .eq("id", interviewCopilotId)
    .single();
  if (error) {
    const t = await getTranslations("errors");
    logger.error("Error fetching interview copilot status", { error });
    await logger.flush();
    return { error: t("pleaseTryAgain") };
  }
  return { deletionStatus: data.deletion_status };
};

async function fetchInterviewCopilotData(interviewCopilotId: string) {
  const supabase = await createSupabaseServerClient();

  // Fetch interview copilot data
  const { data: interviewCopilot, error: interviewCopilotError } =
    await supabase
      .from("interview_copilots")
      .select("*")
      .eq("id", interviewCopilotId)
      .single();

  if (interviewCopilotError) throw interviewCopilotError;

  // Fetch questions and answers
  const { data: questionsAndAnswers, error: questionsAndAnswersError } =
    await supabase
      .from("interview_copilot_questions_and_answers")
      .select("*")
      .eq("interview_copilot_id", interviewCopilotId)
      .order("created_at", { ascending: true });

  if (questionsAndAnswersError) throw questionsAndAnswersError;

  // Generate signed URL for the recording
  const { data: signedUrl } = await supabase.storage
    .from("interview_copilot_recordings")
    .createSignedUrl(interviewCopilot.file_path!, 60 * 60); // 1 hour expiry

  return {
    questionsAndAnswers,
    recordingUrl: signedUrl?.signedUrl,
  };
}

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ interviewCopilotId: string }>;
}) {
  const { interviewCopilotId } = await params;
  const { deletionStatus } =
    await fetchInterviewCopilotStatus(interviewCopilotId);

  if (deletionStatus === "deleted") {
    redirect("/dashboard/interview-copilots");
  }
  const data = await fetchInterviewCopilotData(interviewCopilotId);

  return (
    <div className="container mx-auto py-6">
      <InterviewCopilotReviewClientComponent
        questionsAndAnswers={data.questionsAndAnswers}
        recordingUrl={data.recordingUrl ?? ""}
      />
    </div>
  );
}
