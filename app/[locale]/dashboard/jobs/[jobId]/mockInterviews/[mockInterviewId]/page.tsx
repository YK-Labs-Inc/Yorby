import { createSupabaseServerClient } from "@/utils/supabase/server";
import MockInterviewClientComponent from "./MockInterviewClientComponent";

const fetchMockInterviewPreviousMessageHistroy = async (
  mockInterviewId: string
) => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("mock_interview_messages")
    .select("*")
    .eq("mock_interview_id", mockInterviewId)
    .order("created_at", { ascending: false });
  if (error) {
    throw error;
  }
  return data;
};

export default async function MockInterviewPage({
  params,
}: {
  params: Promise<{ jobId: string; mockInterviewId: string }>;
}) {
  const jobId = (await params).jobId;
  const mockInterviewId = (await params).mockInterviewId;
  const previousMessageHistory =
    await fetchMockInterviewPreviousMessageHistroy(mockInterviewId);
  return (
    <MockInterviewClientComponent
      jobId={jobId}
      mockInterviewId={mockInterviewId}
      messageHistory={previousMessageHistory}
    />
  );
}
