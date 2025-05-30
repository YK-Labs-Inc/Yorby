import CustomJob from "./CustomJob";

const CustomJobPage = async ({
  params,
  searchParams,
}: {
  params: Promise<{ jobId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
  const jobId = (await params).jobId;
  return (
    <CustomJob
      jobId={jobId}
      searchParams={searchParams}
      isMultiTenantExperience={false}
    />
  );
};

export default CustomJobPage;
