import { Suspense } from "react";
import { fetchStudentEnrolledJobs, fetchJobCounts } from "@/utils/supabase/queries/studentActivity";
import JobSelector from "./JobSelector";
import TabSelector from "./TabSelector";
import QuestionsSection from "./QuestionsSection";
import MockInterviewsSection from "./MockInterviewsSection";
import { getTranslations } from "next-intl/server";

interface StudentActivitySidebarV2Props {
  studentId: string;
  coachId: string;
  activeJobId: string;
  locale: string;
}

export default async function StudentActivitySidebarV2({
  studentId,
  coachId,
  activeJobId,
  locale,
}: StudentActivitySidebarV2Props) {
  const t = await getTranslations("StudentActivitySidebar");
  
  // Fetch only the list of enrolled jobs
  const enrolledJobs = await fetchStudentEnrolledJobs(studentId, coachId);
  
  if (!enrolledJobs || enrolledJobs.length === 0) {
    return (
      <aside className="w-80 border-r p-6 bg-gray-50 h-full">
        {t("noJobsFound")}
      </aside>
    );
  }

  // Fetch counts for all jobs
  const jobIds = enrolledJobs.map(job => job.id);
  const jobCounts = await fetchJobCounts(jobIds);
  
  // Enhance jobs with counts
  const jobsWithCounts = enrolledJobs.map(job => ({
    ...job,
    ...jobCounts[job.id],
  }));

  const selectedJob = jobsWithCounts.find((job) => job.id === activeJobId) || jobsWithCounts[0];

  return (
    <aside className="w-80 border-r flex flex-col overflow-y-auto h-full min-h-0">
      <div className="p-4 border-b border-gray-200">
        <JobSelector
          jobs={jobsWithCounts}
          selectedJob={selectedJob}
          studentId={studentId}
          locale={locale}
        />
      </div>

      <TabSelector locale={locale}>
        <Suspense fallback={<LoadingSection />}>
          <QuestionsSection
            jobId={selectedJob.id}
            studentId={studentId}
            locale={locale}
          />
        </Suspense>
        <Suspense fallback={<LoadingSection />}>
          <MockInterviewsSection
            jobId={selectedJob.id}
            studentId={studentId}
            locale={locale}
          />
        </Suspense>
      </TabSelector>
    </aside>
  );
}

function LoadingSection() {
  return (
    <div className="flex-1 p-4">
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-20 bg-gray-100 rounded-md animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}