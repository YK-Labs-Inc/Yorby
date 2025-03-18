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
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <ResumePreview
          loading={false}
          resume={resumeData}
          setResume={() => {}}
          resumeId={resumeId}
          hasReachedFreemiumLimit={false}
          isFreemiumEnabled={false}
          isLocked={true}
        />
      </div>
    </div>
  );
}
