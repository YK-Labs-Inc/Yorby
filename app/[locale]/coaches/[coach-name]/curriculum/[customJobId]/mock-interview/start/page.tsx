import React from "react";

interface StudentStartMockInterviewPageProps {
  params: Promise<{
    coachName: string;
    customJobId: string;
    locale: string;
  }>;
}

export default async function StudentStartMockInterviewPage({
  params,
}: StudentStartMockInterviewPageProps) {
  const resolvedParams = await params;
  return (
    <div>
      <h1>Start Mock Interview (Student View)</h1>
      <p>
        Purpose: Student confirms the curriculum and any settings before
        beginning a mock interview session.
      </p>
      <p>Coach Name: {resolvedParams.coachName}</p>
      <p>Custom Job ID: {resolvedParams.customJobId}</p>
    </div>
  );
}
