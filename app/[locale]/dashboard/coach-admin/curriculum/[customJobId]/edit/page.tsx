import React from "react";

interface EditCurriculumDetailsPageProps {
  params: Promise<{
    customJobId: string;
    locale: string;
  }>;
}

export default async function EditCurriculumDetailsPage({
  params,
}: EditCurriculumDetailsPageProps) {
  const resolvedParams = await params;
  return (
    <div>
      <h1>Edit Curriculum Details</h1>
      <p>Purpose: Form to modify the details of an existing custom_job.</p>
      <p>Custom Job ID: {resolvedParams.customJobId}</p>
    </div>
  );
}
