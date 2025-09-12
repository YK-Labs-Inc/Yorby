"use client";

import useSWR, { mutate } from "swr";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import {
  Candidate,
  CandidateData,
  getInitialCandidates,
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

const candidatesFetcher = async ([_, companyId, jobId, stageIds]: [
  string,
  string,
  string,
  string[] | undefined,
]) => {
  return await getInitialCandidates(companyId, jobId, 10, stageIds);
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

export default function CandidateClientWrapper({
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
  // Fetch candidates list when no specific candidate is selected
  const {
    data: candidates = [],
    error: candidatesError,
    isLoading: candidatesLoading,
  } = useSWR<Candidate[]>(
    companyId && jobId ? ["candidates", companyId, jobId, stageIds] : null,
    candidatesFetcher
  );

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
    if (companyId && jobId) {
      mutate(["candidates", companyId, jobId, stageIds]);
    }
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
            isPremium={isPremium}
            companyCandidateCount={candidateCount}
            isLoading={candidatesLoading}
            loadingError={candidatesError}
            onRetry={handleRetry}
            selectCandidate={selectCandidate}
            stageIds={stageIds}
          />

          {/* Right Content - Candidate Overview */}
          <div className="flex-1 min-w-0 overflow-hidden">
            <Suspense fallback={<CandidateOverviewSkeleton />}>
              {candidateData ? (
                <CandidateOverview
                  candidateData={candidateData}
                  jobInterviewCount={interviewCount}
                  loadingCandidateData={candidateLoading}
                  hasError={candidateError}
                  onRetry={handleCandidateRetry}
                  stageIds={stageIds}
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
