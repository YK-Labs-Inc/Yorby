import React from "react";

interface ManageQuestionsPageProps {
  params: Promise<{
    customJobId: string;
    locale: string;
  }>;
}

export default async function ManageQuestionsPage({
  params,
}: ManageQuestionsPageProps) {
  const resolvedParams = await params;
  return (
    <div>
      <h1>Manage Questions for a Curriculum</h1>
      <p>
        Purpose: For a selected curriculum, coaches can view, add, edit, or
        delete specific interview questions.
      </p>
      <p>Custom Job ID: {resolvedParams.customJobId}</p>
    </div>
  );
}
