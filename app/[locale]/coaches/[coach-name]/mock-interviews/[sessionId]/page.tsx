import React from "react";

interface StudentMockInterviewSessionPageProps {
  params: Promise<{
    coachName: string;
    sessionId: string;
    locale: string;
  }>;
}

export default async function StudentMockInterviewSessionPage({
  params,
}: StudentMockInterviewSessionPageProps) {
  const resolvedParams = await params;
  return (
    <div>
      <h1>Mock Interview Session (Student View)</h1>
      <p>
        Purpose: The live mock interview interface. After completion, this page
        would show the session summary, AI feedback, and any coach feedback.
      </p>
      <p>Coach Name: {resolvedParams.coachName}</p>
      <p>Session ID: {resolvedParams.sessionId}</p>
    </div>
  );
}
