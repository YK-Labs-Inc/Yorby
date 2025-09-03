import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import CandidateOverview from "./CandidateOverview";
import CandidatesList from "./CandidatesList";
import CandidateOverviewSkeleton from "./CandidateOverviewSkeleton";
import EmptyState from "./EmptyState";
import {
  validateAccess,
  getInitialCandidates,
  getCandidateData,
  isCompanyPremium,
  getCompanyCandidateCount,
} from "./actions";
import { getTranslations } from "next-intl/server";

interface PageProps {
  params: Promise<{
    id: string;
    jobId: string;
  }>;
  searchParams: Promise<{
    candidateId?: string;
  }>;
}

export default async function CandidatesPage({
  params,
  searchParams,
}: PageProps) {
  const t = await getTranslations("apply.recruiting.candidates.page");

  // Await the params and searchParams
  const { id: companyId, jobId } = await params;
  const { candidateId } = await searchParams;
  const isPremium = await isCompanyPremium(companyId);

  // Parallel fetch all required data
  const [
    { company, job },
    initialCandidates,
    selectedCandidateData,
    companyCandidateCount,
  ] = await Promise.all([
    validateAccess(companyId, jobId),
    getInitialCandidates(companyId, jobId, 10),
    candidateId ? getCandidateData(candidateId) : Promise.resolve(null),
    isPremium ? getCompanyCandidateCount(companyId) : Promise.resolve(0),
  ]);

  // Auto-select first candidate if none selected and candidates exist
  const effectiveCandidateId =
    candidateId ||
    (initialCandidates.length > 0 ? initialCandidates[0].id : null);

  // If no candidate is selected but we have candidates, fetch the first one's data
  const effectiveSelectedCandidateData =
    selectedCandidateData ||
    (effectiveCandidateId && !candidateId
      ? await getCandidateData(effectiveCandidateId)
      : null);

  return (
    <div className="h-screen bg-white flex flex-col">
      <div className="container mx-auto px-4 pt-4 flex-shrink-0">
        {/* Back button */}
        <Link
          href={`/recruiting/companies/${companyId}/jobs/${jobId}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group mb-4"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>{t("back")}</span>
        </Link>
      </div>

      {/* Main Content Area - Takes remaining height */}
      <div className="container mx-auto px-4 pb-4 flex-1 flex min-h-0 overflow-hidden">
        <div className="flex h-full w-full shadow-sm rounded-lg">
          {/* Left Sidebar - Candidate List (Client Component) */}
          <CandidatesList
            initialCandidates={initialCandidates}
            companyId={companyId}
            jobId={jobId}
            selectedCandidateId={effectiveCandidateId || undefined}
            isPremium={isPremium}
            companyCandidateCount={companyCandidateCount}
          />

          {/* Right Content - Candidate Overview */}
          <div className="flex-1 min-w-0 overflow-hidden">
            <Suspense fallback={<CandidateOverviewSkeleton />}>
              {effectiveSelectedCandidateData ? (
                <CandidateOverview
                  candidateData={effectiveSelectedCandidateData}
                />
              ) : (
                <EmptyState />
              )}
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
