import MockInterviewReviewClientComponent from "./MockInterviewReviewClientComponent";
import { trackServerEvent } from "@/utils/tracking/serverUtils";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Logger } from "next-axiom";

async function fetchMockInterviewData(mockInterviewId: string) {
  const supabase = await createSupabaseServerClient();
  const logger = new Logger().with({
    function: "fetchMockInterviewData",
    mockInterviewId,
  });

  // Fetch mock interview data
  const { data: mockInterview, error: mockInterviewError } = await supabase
    .from("custom_job_mock_interviews")
    .select("*")
    .eq("id", mockInterviewId)
    .single();

  if (mockInterviewError) {
    logger.error("Error fetching mock interview data", {
      mockInterviewError,
    });
    await logger.flush();
    throw mockInterviewError;
  }

  // Fetch messages
  const { data: messages, error: messagesError } = await supabase
    .from("mock_interview_messages")
    .select("*, mux_metadata:mock_interview_message_mux_metadata(*)")
    .eq("mock_interview_id", mockInterviewId)
    .order("created_at", { ascending: true });

  if (messagesError) {
    logger.error("Error fetching mock interview messages", {
      messagesError,
    });
    await logger.flush();
    throw messagesError;
  }

  // Fetch feedback
  const { data: feedback, error: feedbackError } = await supabase
    .from("custom_job_mock_interview_feedback")
    .select("*")
    .eq("mock_interview_id", mockInterviewId)
    .single();

  if (feedbackError) {
    logger.error("Error fetching mock interview feedback", {
      feedbackError,
    });
    await logger.flush();
    throw feedbackError;
  }

  // Fetch question feedback
  const { data: questionFeedback, error: questionFeedbackError } =
    await supabase
      .from("mock_interview_question_feedback")
      .select("*")
      .eq("mock_interview_id", mockInterviewId)
      .order("created_at", { ascending: true });

  if (questionFeedbackError) {
    logger.error("Error fetching mock interview question feedback", {
      questionFeedbackError,
    });
    await logger.flush();
    throw questionFeedbackError;
  }

  // Generate signed URL for the recording only if recording_file_path exists
  let signedUrl: string | null = null;
  if (mockInterview.recording_file_path) {
    const { data: urlData } = await supabase.storage
      .from("mock_interviews")
      .createSignedUrl(mockInterview.recording_file_path, 60 * 60); // 1 hour expiry
    signedUrl = urlData?.signedUrl ?? null;
  }

  return {
    mockInterview,
    messages,
    feedback,
    questionFeedback,
    recordingUrl: signedUrl,
  };
}

const MockInterviewReview = async ({
  mockInterviewId,
}: {
  mockInterviewId: string;
}) => {
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
        recordingUrl={data.recordingUrl}
      />
    </div>
  );
};

export default MockInterviewReview;
