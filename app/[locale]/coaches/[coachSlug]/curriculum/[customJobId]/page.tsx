import React from "react";

interface StudentCurriculumOverviewPageProps {
  params: Promise<{
    coachName: string;
    customJobId: string;
    locale: string;
  }>;
}

export default async function StudentCurriculumOverviewPage({
  params,
}: StudentCurriculumOverviewPageProps) {
  const resolvedParams = await params;
  return (
    <div>
      <h1>Curriculum Overview (Student View)</h1>
      <p>
        Purpose: Shows details of a specific curriculum from the coach, lists
        questions, and provides options to start practicing questions or
        initiate a mock interview using this curriculum.
      </p>
      <p>Coach Name: {resolvedParams.coachName}</p>
      <p>Custom Job ID: {resolvedParams.customJobId}</p>
    </div>
  );
}
