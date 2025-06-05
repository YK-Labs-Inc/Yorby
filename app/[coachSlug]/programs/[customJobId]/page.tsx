import CustomJob from "@/app/dashboard/jobs/[jobId]/CustomJob";

interface StudentCurriculumOverviewPageProps {
  params: Promise<{
    coachName: string;
    customJobId: string;
    locale: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function StudentCurriculumOverviewPage({
  params,
  searchParams,
}: StudentCurriculumOverviewPageProps) {
  const jobId = (await params).customJobId;
  return (
    <CustomJob
      jobId={jobId}
      searchParams={searchParams}
      isMultiTenantExperience={true}
    />
  );
}
