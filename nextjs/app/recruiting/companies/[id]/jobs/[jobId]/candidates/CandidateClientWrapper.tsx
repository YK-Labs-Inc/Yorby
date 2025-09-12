"use client";

import useSWR, { mutate } from "swr";
import useSWRInfinite from "swr/infinite";
import { Suspense } from "react";
import {
  Candidate,
  CandidateData,
  getCandidates,
  getCandidateData,
  getCompanyCandidateCount,
  getJobInterviewCount,
} from "./actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import CandidatesList from "./CandidatesList";
import CandidateOverviewSkeleton from "./CandidateOverviewSkeleton";
import CandidateOverview from "./CandidateOverview";
import EmptyState from "./EmptyState";
import { CandidateStageProvider, useCandidateStage } from "./CandidateStageContext";

const candidatesFetcher = async ([_, companyId, jobId, stageIds, offset]: [
  string,
  string,
  string,
  string[] | undefined,
  number,
]) => {
  return await getCandidates(companyId, jobId, offset, 10, stageIds);
};

const candidateDataFetcher = async ([_, candidateId]: [string, string]) => {
  return await getCandidateData(candidateId);
};

const candidateCountFetcher = async ([_, companyId]: [string, string]) => {
  return await getCompanyCandidateCount(companyId);
};

const interviewCountFetcher = async ([_, jobId]: [string, string]) => {
  return await getJobInterviewCount(jobId);
};

function CandidateClientWrapperInner({
  isPremium,
  companyId,
  jobId,
  candidateId,
  stageIds = [],
}: {
  companyId: string;
  jobId: string;
  candidateId?: string;
  isPremium: boolean;
  stageIds?: string[];
}) {
  const t = useTranslations("apply.recruiting.candidates.page");
  const { getCandidateStage } = useCandidateStage();

  // Use useSWRInfinite for proper pagination
  const {
    data: candidatesPages = [],
    error: candidatesError,
    isLoading: candidatesLoading,
    isValidating,
    size,
    setSize,
    mutate: mutateCandidates,
  } = useSWRInfinite<Candidate[]>(
    (pageIndex, previousPageData) => {
      // Stop fetching if we don't have the required params
      if (!companyId || !jobId) return null;

      // Stop fetching if the previous page was empty (no more data)
      if (previousPageData && previousPageData.length === 0) return null;

      // Generate key for this page
      return ["candidates", companyId, jobId, stageIds, pageIndex * 10];
    },
    candidatesFetcher,
    {
      revalidateFirstPage: false, // Don't revalidate first page when adding new pages
      persistSize: true, // Keep size when revalidating
    }
  );

  // Flatten the pages into a single array of candidates and apply optimistic updates
  const candidates = candidatesPages.flat().map(candidate => ({
    ...candidate,
    currentStage: getCandidateStage(candidate.id, candidate.currentStage)
  }));

  // Check if we have more data to load
  const isEmpty = candidatesPages?.[0]?.length === 0;
  const isReachingEnd =
    isEmpty ||
    (candidatesPages &&
      candidatesPages[candidatesPages.length - 1]?.length < 10);
  const hasMore = !isReachingEnd;

  const effectiveCandidateId =
    candidateId ||
    (candidates && candidates.length > 0 ? candidates[0].id : null);

  // Fetch individual candidate data when candidateId is present
  const {
    data: candidateData,
    error: candidateError,
    isLoading: candidateLoading,
  } = useSWR<CandidateData | null>(
    effectiveCandidateId ? ["candidate-data", effectiveCandidateId] : null,
    candidateDataFetcher
  );

  // Fetch company candidate count
  const { data: candidateCount = 0 } = useSWR<number>(
    companyId ? ["candidate-count", companyId] : null,
    candidateCountFetcher
  );

  // Fetch job interview count
  const { data: interviewCount = 0 } = useSWR<number>(
    jobId ? ["interview-count", jobId] : null,
    interviewCountFetcher
  );

  const handleRetry = () => {
    mutateCandidates();
  };

  const handleCandidateRetry = () => {
    if (effectiveCandidateId) {
      mutate(["candidate-data", effectiveCandidateId]);
    }
  };

  const selectCandidate = (candidateId: string) => {
    mutate(["candidate-data", candidateId]);
  };

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
            candidates={candidates}
            companyId={companyId}
            jobId={jobId}
            selectedCandidateId={effectiveCandidateId || undefined}
            isLoading={candidatesLoading}
            loadingError={candidatesError}
            onRetry={handleRetry}
            selectCandidate={selectCandidate}
            stageIds={stageIds}
            onLoadMore={() => setSize(size + 1)}
            hasMore={hasMore}
            isLoadingMore={isValidating && !candidatesLoading}
          />

          {/* Right Content - Candidate Overview */}
          <div className="flex-1 min-w-0 overflow-hidden">
            <Suspense fallback={<CandidateOverviewSkeleton />}>
              {candidateData ? (
                <CandidateOverview
                  candidateData={{
                    ...candidateData,
                    candidate: {
                      ...candidateData.candidate,
                      currentStage: getCandidateStage(
                        candidateData.candidate.id,
                        candidateData.candidate.currentStage
                      )
                    }
                  }}
                  jobInterviewCount={interviewCount}
                  loadingCandidateData={candidateLoading}
                  hasError={candidateError}
                  onRetry={handleCandidateRetry}
                  stageIds={stageIds}
                  isPremium={isPremium}
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

export default function CandidateClientWrapper(props: {
  companyId: string;
  jobId: string;
  candidateId?: string;
  isPremium: boolean;
  stageIds?: string[];
}) {
  return (
    <CandidateStageProvider>
      <CandidateClientWrapperInner {...props} />
    </CandidateStageProvider>
  );
}
