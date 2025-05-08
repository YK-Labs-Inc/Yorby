import React from "react";

interface CoachStudentAnswerReviewPageProps {
  params: Promise<{
    studentId: string;
    answerId: string;
    locale: string;
  }>;
}

export default async function CoachStudentAnswerReviewPage({
  params,
}: CoachStudentAnswerReviewPageProps) {
  const resolvedParams = await params;
  return (
    <div>
      <h1>Coach&apos;s Review of Student&apos;s Practice Question Answer</h1>
      <p>
        Purpose: Coach can view a student&apos;s answer to a specific practice
        question and provide feedback.
      </p>
      <p>Student ID: {resolvedParams.studentId}</p>
      <p>Answer ID: {resolvedParams.answerId}</p>
    </div>
  );
}
