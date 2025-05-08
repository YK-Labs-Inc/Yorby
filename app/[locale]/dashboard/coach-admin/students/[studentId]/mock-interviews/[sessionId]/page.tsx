import React from "react";

interface CoachStudentMockInterviewPageProps {
  params: Promise<{
    studentId: string;
    sessionId: string;
    locale: string;
  }>;
}

export default async function CoachStudentMockInterviewPage({
  params,
}: CoachStudentMockInterviewPageProps) {
  const resolvedParams = await params;
  return (
    <div>
      <h1>Coach&apos;s View of Student&apos;s Mock Interview Session</h1>
      <p>
        Purpose: Coach can review the details of a mock interview session a
        student completed.
      </p>
      <p>Student ID: {resolvedParams.studentId}</p>
      <p>Session ID: {resolvedParams.sessionId}</p>
    </div>
  );
}
