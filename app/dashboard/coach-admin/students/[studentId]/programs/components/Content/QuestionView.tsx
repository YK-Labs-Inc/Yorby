"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Tables } from "@/utils/supabase/database.types";
import ClientSideStudentQuestionSubmissions from "./ClientSideStudentQuestionSubmissions";
import { getQuestionSubmissions } from "@/app/dashboard/coach-admin/actions";
import useSWR, { mutate as swrMutate } from "swr";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface QuestionViewProps {
  questionId: string;
  studentId: string;
}

export default function QuestionView({
  questionId,
  studentId,
}: QuestionViewProps) {
  const t = useTranslations("AdminStudentView");
  const [currentSubmissionId, setCurrentSubmissionId] = useState<string | null>(
    null
  );

  // Use SWR for data fetching with caching
  const { data, error, isLoading, mutate } = useSWR(
    [`questionSubmissions-${questionId}-${studentId}`],
    async () => {
      const result = await getQuestionSubmissions(questionId, studentId);
      return result;
    }
  );

  // Function to handle feedback updates - revalidate both this data and the questions list
  const handleFeedbackUpdate = async () => {
    // Revalidate current question data
    await mutate();

    // Also revalidate the questions list to update the feedback indicator
    // We need to get the programId from the question data
    if (data?.question?.custom_job_id) {
      const programId = data.question.custom_job_id;
      // Manually trigger revalidation of the questions list
      await swrMutate([`programQuestions-${programId}-${studentId}`]);
    }
  };

  // Set initial submission when data loads
  useEffect(() => {
    if (data?.submissions && data.submissions.length > 0) {
      setCurrentSubmissionId(data.submissions[0].id);
    }
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner />
      </div>
    );
  }

  if (!data || error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-600">{t("errorLoadingQuestion")}</p>
      </div>
    );
  }

  // Handle submission change
  const handleSubmissionChange = (submissionId: string) => {
    setCurrentSubmissionId(submissionId);
  };

  const currentSubmission = data.submissions?.find(
    (s) => s.id === currentSubmissionId
  );
  const currentCoachFeedback = currentSubmission?.coachFeedback || null;

  // The StudentQuestionSubmissions component expects the question to have custom_job_question_submissions
  const questionWithSubmissions = {
    ...data.question,
    custom_job_question_submissions: data.submissions || [],
  };

  return (
    <div className="h-full">
      <ClientSideStudentQuestionSubmissions
        studentId={studentId}
        jobId={data.question.custom_job_id}
        questionId={questionId}
        question={questionWithSubmissions as any}
        submissions={data.submissions}
        currentSubmissionId={currentSubmissionId || ""}
        currentSubmission={currentSubmission || null}
        currentCoachFeedback={currentCoachFeedback}
        onSubmissionChange={handleSubmissionChange}
        onFeedbackUpdate={handleFeedbackUpdate}
      />
    </div>
  );
}
