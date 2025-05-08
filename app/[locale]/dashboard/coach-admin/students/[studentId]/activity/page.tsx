import React from "react";

interface StudentActivityPageProps {
  params: Promise<{
    studentId: string;
    locale: string;
  }>;
}

export default async function StudentActivityPage({
  params,
}: StudentActivityPageProps) {
  const resolvedParams = await params;
  return (
    <div>
      <h1>View Specific Student&apos;s Activity</h1>
      <p>
        Purpose: Coach can see a summary of a specific student&apos;s engagement
        with their curricula.
      </p>
      <p>Student ID: {resolvedParams.studentId}</p>
    </div>
  );
}
