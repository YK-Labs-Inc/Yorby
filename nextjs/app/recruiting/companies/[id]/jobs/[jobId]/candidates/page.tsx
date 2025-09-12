import { isCompanyPremium } from "./actions";
import CandidateClientWrapper from "./CandidateClientWrapper";

interface PageProps {
  params: Promise<{
    id: string;
    jobId: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CandidatesPage({
  params,
  searchParams,
}: PageProps) {
  const { id: companyId, jobId } = await params;
  const resolvedSearchParams = await searchParams;
  const { candidateId, stageIds } = resolvedSearchParams as {
    candidateId?: string;
    stageIds?: string;
  };
  const isPremium = await isCompanyPremium(companyId);
  return (
    <CandidateClientWrapper
      companyId={companyId}
      jobId={jobId}
      isPremium={isPremium}
      candidateId={candidateId}
      stageIds={stageIds?.split(",")}
    />
  );
}
