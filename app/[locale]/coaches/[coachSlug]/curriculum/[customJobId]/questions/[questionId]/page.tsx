import QuestionComponent from "@/app/[locale]/dashboard/jobs/[jobId]/questions/[questionId]/QuestionComponent";
import React from "react";

interface StudentPracticeQuestionPageProps {
  params: Promise<{
    coachName: string;
    customJobId: string;
    questionId: string;
    locale: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function StudentPracticeQuestionPage({
  params,
  searchParams,
}: StudentPracticeQuestionPageProps) {
  const resolvedParams = await params;
  const { submissionId } = (await searchParams) as {
    submissionId?: string;
  };
  return (
    <QuestionComponent
      questionId={resolvedParams.questionId}
      jobId={resolvedParams.customJobId}
      submissionId={submissionId}
    />
  );
}
