"use client";

import useSWR, { mutate } from "swr";
import useSWRInfinite from "swr/infinite";
import { Suspense } from "react";
import {
  Candidate,
  CandidateData,
  CandidateBasicData,
  CandidateImportantData,
  CandidateInterviewData,
  getCandidates,
  getCandidateBasicData,
  getCandidateImportantData,
  getCandidateInterviewData,
  getJobInterviewCount,
} from "./actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import CandidatesList from "./CandidatesList";
import CandidateOverviewSkeleton from "./CandidateOverviewSkeleton";
import CandidateOverview from "./CandidateOverview";
import EmptyState from "./EmptyState";
import {
  CandidateStageProvider,
  useCandidateStage,
} from "./CandidateStageContext";

const candidatesFetcher = async ([_, companyId, jobId, stageIds, offset]: [
  string,
  string,
  string,
  string[] | undefined,
  number,
]) => {
  return await getCandidates(companyId, jobId, offset, 10, stageIds);
};

const candidateBasicDataFetcher = async ([_, candidateId]: [
  string,
  string,
]) => {
  return await getCandidateBasicData(candidateId);
};

const candidateImportantDataFetcher = async ([_, candidateId]: [
  string,
  string,
]) => {
  return await getCandidateImportantData(candidateId);
};

const candidateInterviewDataFetcher = async ([_, candidateId]: [
  string,
  string,
]) => {
  return await getCandidateInterviewData(candidateId);
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
    isValidating: candidatesIsValidating,
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
  const candidates = candidatesPages.flat().map((candidate) => ({
    ...candidate,
    currentStage: getCandidateStage(candidate.id, candidate.currentStage),
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

  // Fetch tiered candidate data for progressive loading
  const {
    data: candidateBasicData,
    error: candidateBasicError,
    isLoading: candidateBasicLoading,
    isValidating: candidateBasicIsValidating,
  } = useSWR<CandidateBasicData | null>(
    effectiveCandidateId
      ? ["candidate-basic-data", effectiveCandidateId]
      : null,
    candidateBasicDataFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  const {
    data: candidateImportantData,
    error: candidateImportantError,
    isLoading: candidateImportantLoading,
    isValidating: candidateImportantIsValidating,
  } = useSWR<CandidateImportantData | null>(
    effectiveCandidateId
      ? ["candidate-important-data", effectiveCandidateId]
      : null,
    candidateImportantDataFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  const {
    data: candidateInterviewData,
    error: candidateInterviewError,
    isLoading: candidateInterviewLoading,
    isValidating: candidateInterviewIsValidating,
  } = useSWR<CandidateInterviewData | null>(
    effectiveCandidateId
      ? ["candidate-interview-data", effectiveCandidateId]
      : null,
    candidateInterviewDataFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000,
    }
  );

  // Fetch job interview count
  const { data: interviewCount = 0 } = useSWR<number>(
    jobId ? ["interview-count", jobId] : null,
    interviewCountFetcher
  );

  const handleRetry = () => {
    mutateCandidates();
  };

  const handleBasicDataRetry = () => {
    if (effectiveCandidateId) {
      mutate(["candidate-basic-data", effectiveCandidateId]);
    }
  };

  const handleImportantDataRetry = () => {
    if (effectiveCandidateId) {
      mutate(["candidate-important-data", effectiveCandidateId]);
    }
  };

  const handleInterviewDataRetry = () => {
    if (effectiveCandidateId) {
      mutate(["candidate-interview-data", effectiveCandidateId]);
    }
  };

  const selectCandidate = (candidateId: string) => {
    // Find the candidate from list for optimistic update
    const selectedCandidate = candidates.find((c) => c.id === candidateId);

    if (selectedCandidate) {
      // Optimistic update with candidate list data
      const optimisticBasicData: CandidateBasicData = {
        candidate: selectedCandidate,
        additionalInfo: [],
      };

      // Update cache immediately with optimistic data
      mutate(["candidate-basic-data", candidateId], optimisticBasicData, {
        revalidate: true,
      });
    }

    // Trigger fresh data fetching
    mutate(["candidate-basic-data", candidateId]);
    mutate(["candidate-important-data", candidateId]);
    mutate(["candidate-interview-data", candidateId]);
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
            isLoadingMore={candidatesIsValidating && !candidatesLoading}
          />

          {/* Right Content - Candidate Overview */}
          <div className="flex-1 min-w-0 overflow-hidden">
            <CandidateOverview
              candidateBasicData={candidateBasicData}
              loadingImportantData={
                candidateImportantLoading || candidateImportantIsValidating
              }
              importantDataError={candidateImportantError}
              candidateImportantData={candidateImportantData}
              loadingInterviewData={
                candidateInterviewLoading || candidateInterviewIsValidating
              }
              interviewDataError={candidateInterviewError}
              candidateInterviewData={candidateInterviewData}
              jobInterviewCount={interviewCount}
              loadingCandidateData={
                candidateBasicLoading || candidateBasicIsValidating
              }
              hasBasicDataError={candidateBasicError}
              onBasicDataRetry={handleBasicDataRetry}
              hasImportantDataError={candidateImportantError}
              onImportantDataRetry={handleImportantDataRetry}
              hasInterviewDataError={candidateInterviewError}
              onInterviewDataRetry={handleInterviewDataRetry}
              stageIds={stageIds}
              isPremium={isPremium}
            />
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
