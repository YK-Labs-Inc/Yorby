"use client";

import { useEffect, useState } from "react";
import MockInterviewReviewClientComponent from "./MockInterviewReviewClientComponent";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface MockInterviewData {
  mockInterview: any;
  messages: any[];
  feedback: any;
  questionFeedback: any[];
  recordingUrl: string | null;
}

const MockInterviewReview = ({
  mockInterviewId,
}: {
  mockInterviewId: string;
}) => {
  const [data, setData] = useState<MockInterviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { logError, logInfo } = useAxiomLogging();

  useEffect(() => {
    async function fetchMockInterviewData() {
      try {
        const supabase = createSupabaseBrowserClient();

        // Fetch mock interview data
        const { data: mockInterview, error: mockInterviewError } =
          await supabase
            .from("custom_job_mock_interviews")
            .select("*")
            .eq("id", mockInterviewId)
            .single();

        if (mockInterviewError) {
          logError("Error fetching mock interview data", {
            mockInterviewError,
            mockInterviewId,
          });
          throw mockInterviewError;
        }

        // Fetch messages
        const { data: messages, error: messagesError } = await supabase
          .from("mock_interview_messages")
          .select("*, mux_metadata:mock_interview_message_mux_metadata(*)")
          .eq("mock_interview_id", mockInterviewId)
          .order("created_at", { ascending: true });

        if (messagesError) {
          logError("Error fetching mock interview messages", {
            messagesError,
            mockInterviewId,
          });
          throw messagesError;
        }

        // Fetch feedback
        const { data: feedback, error: feedbackError } = await supabase
          .from("custom_job_mock_interview_feedback")
          .select("*")
          .eq("mock_interview_id", mockInterviewId)
          .single();

        if (feedbackError && feedbackError.code !== "PGRST116") {
          logError("Error fetching mock interview feedback", {
            feedbackError,
            mockInterviewId,
          });
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
          logError("Error fetching mock interview question feedback", {
            questionFeedbackError,
            mockInterviewId,
          });
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

        setData({
          mockInterview,
          messages: messages || [],
          feedback: feedback || null,
          questionFeedback: questionFeedback || [],
          recordingUrl: signedUrl,
        });

        // Track event
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.id) {
          logInfo("mock_interview_reviewed", {
            mockInterviewId,
            userId: user.id,
          });
        }
      } catch (err) {
        logError("Failed to fetch mock interview data", { error: err });
        setError("Failed to load mock interview data");
      } finally {
        setLoading(false);
      }
    }

    fetchMockInterviewData();
  }, [mockInterviewId, logError, logInfo]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500">
            {error || "Failed to load mock interview"}
          </p>
        </div>
      </div>
    );
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
