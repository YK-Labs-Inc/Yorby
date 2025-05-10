import { createSupabaseServerClient } from "@/utils/supabase/server";
import MockInterviewClientComponent from "./MockInterviewClientComponent";

const fetchMockInterviewPreviousMessageHistory = async (
  mockInterviewId: string
) => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("mock_interview_messages")
    .select("*")
    .eq("mock_interview_id", mockInterviewId)
    .order("created_at", { ascending: true });
  if (error) {
    throw error;
  }
  return data;
};

const MockInterview = async ({
  jobId,
  mockInterviewId,
}: {
  jobId: string;
  mockInterviewId: string;
}) => {
  const previousMessageHistory =
    await fetchMockInterviewPreviousMessageHistory(mockInterviewId);
  return (
    <MockInterviewClientComponent
      jobId={jobId}
      mockInterviewId={mockInterviewId}
      messageHistory={previousMessageHistory}
    />
  );
};

export default MockInterview;
