"use client";

import useSWR, { mutate } from "swr";
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
import { Suspense } from "react";
import CandidateOverviewSkeleton from "./CandidateOverviewSkeleton";
import CandidateOverview from "./CandidateOverview";
import EmptyState from "./EmptyState";

const candidatesFetcher = async ([_, companyId, jobId]: [
  string,
  string,
  string,
]) => {
  return await getInitialCandidates(companyId, jobId, 10);
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
}: {
  companyId: string;
  jobId: string;
  candidateId?: string;
  isPremium: boolean;
}) {
  const t = useTranslations("apply.recruiting.candidates.page");

  // Fetch candidates list when no specific candidate is selected
  const {
    data: candidates = [],
    error: candidatesError,
    isLoading: candidatesLoading,
  } = useSWR<Candidate[]>(
    companyId && jobId ? ["candidates", companyId, jobId] : null,
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
  const {
    data: candidateCount = 0,
    error: candidateCountError,
    isLoading: candidateCountLoading,
  } = useSWR<number>(
    companyId ? ["candidate-count", companyId] : null,
    candidateCountFetcher
  );

  // Fetch job interview count
  const {
    data: interviewCount = 0,
    error: interviewCountError,
    isLoading: interviewCountLoading,
  } = useSWR<number>(
    jobId ? ["interview-count", jobId] : null,
    interviewCountFetcher
  );

  const error =
    candidatesError ||
    candidateError ||
    candidateCountError ||
    interviewCountError;
  const isLoading =
    candidatesLoading ||
    candidateLoading ||
    candidateCountLoading ||
    interviewCountLoading;

  const handleRetry = () => {
    if (companyId && jobId) {
      mutate(["candidates", companyId, jobId]);
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
            initialCandidates={candidates}
            companyId={companyId}
            jobId={jobId}
            selectedCandidateId={effectiveCandidateId || undefined}
            isPremium={isPremium}
            companyCandidateCount={candidateCount}
            isLoading={candidatesLoading}
            loadingError={candidatesError}
            onRetry={handleRetry}
            selectCandidate={selectCandidate}
          />

          {/* Right Content - Candidate Overview */}
          <div className="flex-1 min-w-0 overflow-hidden">
            <Suspense fallback={<CandidateOverviewSkeleton />}>
              {candidateData ? (
                <CandidateOverview
                  candidateData={candidateData}
                  jobInterviewCount={interviewCount}
                  loadingCandidateData={candidateLoading}
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
