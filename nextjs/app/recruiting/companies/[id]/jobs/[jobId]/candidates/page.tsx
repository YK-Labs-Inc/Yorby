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
  const { candidateId } = (await searchParams) as { candidateId?: string };
  const isPremium = await isCompanyPremium(companyId);
  return (
    <CandidateClientWrapper
      companyId={companyId}
      jobId={jobId}
      isPremium={isPremium}
      candidateId={candidateId}
    />
  );
}
