import React from "react";

interface AddNewQuestionPageProps {
  params: Promise<{
    customJobId: string;
    locale: string;
  }>;
}

export default async function AddNewQuestionPage({
  params,
}: AddNewQuestionPageProps) {
  const resolvedParams = await params;
  return (
    <div>
      <h1>Add New Question to Curriculum</h1>
      <p>
        Purpose: Form for a coach to add a new question to the selected
        curriculum.
      </p>
      <p>Custom Job ID: {resolvedParams.customJobId}</p>
    </div>
  );
}
