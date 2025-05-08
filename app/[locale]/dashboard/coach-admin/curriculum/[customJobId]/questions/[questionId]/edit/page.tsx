import React from "react";

interface EditQuestionPageProps {
  params: Promise<{
    customJobId: string;
    questionId: string;
    locale: string;
  }>;
}

export default async function EditQuestionPage({
  params,
}: EditQuestionPageProps) {
  const resolvedParams = await params;
  return (
    <div>
      <h1>Edit Question in Curriculum</h1>
      <p>Purpose: Form to modify an existing question within a curriculum.</p>
      <p>Custom Job ID: {resolvedParams.customJobId}</p>
      <p>Question ID: {resolvedParams.questionId}</p>
    </div>
  );
}
