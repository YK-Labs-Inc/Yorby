"use client";

import { useState } from "react";
import { ResumeDataType } from "../../dashboard/resumes/components/ResumeBuilder";
import ResumePreview from "../../dashboard/resumes/components/ResumePreview";

export default function SampleResume({
  resumeData,
  resumeId,
}: {
  resumeData: ResumeDataType;
  resumeId: string;
}) {
  const [isEditMode, setIsEditMode] = useState(false);
  return (
    <div className="w-full">
      <ResumePreview
        loading={false}
        resume={resumeData}
        setResume={() => {}}
        resumeId={resumeId}
        hasReachedFreemiumLimit={false}
        isFreemiumEnabled={false}
        isLocked={true}
        removeMaxHeight={true}
        isEditMode={isEditMode}
        setIsEditMode={setIsEditMode}
        transformResumeEnabled={false}
      />
    </div>
  );
}
