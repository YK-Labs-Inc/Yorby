import { fetchJobMockInterviews } from "@/utils/supabase/queries/studentActivity";
import MockInterviewItem from "./MockInterviewItem";
import { getTranslations } from "next-intl/server";

interface MockInterviewsSectionProps {
  jobId: string;
  studentId: string;
  locale: string;
}

export default async function MockInterviewsSection({
  jobId,
  studentId,
  locale,
}: MockInterviewsSectionProps) {
  const t = await getTranslations("StudentActivitySidebar");
  
  // Fetch mock interviews for this job
  const mockInterviews = await fetchJobMockInterviews(jobId, studentId);
  
  if (!mockInterviews || mockInterviews.length === 0) {
    return (
      <div className="p-4">
        <p className="text-sm text-gray-500 p-3">
          {t("noMockInterviewsFoundForJob")}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <ul className="space-y-2">
        {mockInterviews.map((mockInterview) => (
          <MockInterviewItem
            key={mockInterview.id}
            mockInterview={mockInterview}
            studentId={studentId}
            jobId={jobId}
            locale={locale}
          />
        ))}
      </ul>
    </div>
  );
}