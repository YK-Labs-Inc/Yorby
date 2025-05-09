import React from "react";

interface StudentPracticeQuestionPageProps {
  params: Promise<{
    coachName: string;
    customJobId: string;
    questionId: string;
    locale: string;
  }>;
}

export default async function StudentPracticeQuestionPage({
  params,
}: StudentPracticeQuestionPageProps) {
  const resolvedParams = await params;
  return (
    <div>
      <h1>Practice Question (Student View)</h1>
      <p>
        Purpose: Student can answer the selected practice question. They should
        be able to see any AI-generated sample answers/feedback, their own
        answer history for this question, and any feedback left by the coach.
      </p>
      <p>Coach Name: {resolvedParams.coachName}</p>
      <p>Custom Job ID: {resolvedParams.customJobId}</p>
      <p>Question ID: {resolvedParams.questionId}</p>
    </div>
  );
}
