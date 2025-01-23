import { createSupabaseServerClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Tables } from "@/utils/supabase/database.types";
import MockInterviewReviewClientComponent from "./MockInterviewReviewClientComponent";
import { trackServerEvent } from "@/utils/tracking/serverUtils";

async function fetchMockInterviewData(mockInterviewId: string) {
  const supabase = await createSupabaseServerClient();

  // Fetch mock interview data
  const { data: mockInterview, error: mockInterviewError } = await supabase
    .from("custom_job_mock_interviews")
    .select("*")
    .eq("id", mockInterviewId)
    .single();

  if (mockInterviewError) throw mockInterviewError;

  // Fetch messages
  const { data: messages, error: messagesError } = await supabase
    .from("mock_interview_messages")
    .select("*")
    .eq("mock_interview_id", mockInterviewId)
    .order("created_at", { ascending: true });

  if (messagesError) throw messagesError;

  // Fetch feedback
  const { data: feedback, error: feedbackError } = await supabase
    .from("custom_job_mock_interview_feedback")
    .select("*")
    .eq("mock_interview_id", mockInterviewId)
    .single();

  if (feedbackError) throw feedbackError;

  // Fetch question feedback
  const { data: questionFeedback, error: questionFeedbackError } =
    await supabase
      .from("mock_interview_question_feedback")
      .select("*")
      .eq("mock_interview_id", mockInterviewId)
      .order("created_at", { ascending: true });

  if (questionFeedbackError) throw questionFeedbackError;

  // Generate signed URL for the recording
  const { data: signedUrl } = await supabase.storage
    .from("mock_interviews")
    .createSignedUrl(mockInterview.recording_file_path!, 60 * 60); // 1 hour expiry

  return {
    mockInterview,
    messages,
    feedback,
    questionFeedback,
    recordingUrl: signedUrl?.signedUrl,
  };
}

export default async function MockInterviewReviewPage({
  params,
}: {
  params: Promise<{ mockInterviewId: string }>;
}) {
  const mockInterviewId = (await params).mockInterviewId;
  const data = await fetchMockInterviewData(mockInterviewId);
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.id) {
    await trackServerEvent({
      eventName: "mock_interview_reviewed",
      userId: user.id,
      args: {
        mockInterviewId,
      },
    });
  }
  return (
    <div className="container mx-auto py-6">
      <MockInterviewReviewClientComponent
        mockInterview={data.mockInterview}
        messages={data.messages}
        feedback={data.feedback}
        questionFeedback={data.questionFeedback}
        recordingUrl={data.recordingUrl ?? ""}
      />
    </div>
  );
}
