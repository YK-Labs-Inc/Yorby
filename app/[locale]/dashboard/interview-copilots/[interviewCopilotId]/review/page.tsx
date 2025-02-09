import { createSupabaseServerClient } from "@/utils/supabase/server";
import InterviewCopilotReviewClientComponent from "./InterviewCopilotReviewClientComponent";

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
    interviewCopilot,
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
  const data = await fetchInterviewCopilotData(interviewCopilotId);
  console.log("data", data);

  return (
    <div className="container mx-auto py-6">
      <InterviewCopilotReviewClientComponent
        interviewCopilot={data.interviewCopilot}
        questionsAndAnswers={data.questionsAndAnswers}
        recordingUrl={data.recordingUrl ?? ""}
      />
    </div>
  );
}
