"use client";

import { ResumeDataType } from "../../dashboard/resumes/components/ResumeBuilder";
import ResumePreview from "../../dashboard/resumes/components/ResumePreview";

export default function SampleResume({
  resumeData,
  resumeId,
}: {
  resumeData: ResumeDataType;
  resumeId: string;
}) {
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
      />
    </div>
  );
}
