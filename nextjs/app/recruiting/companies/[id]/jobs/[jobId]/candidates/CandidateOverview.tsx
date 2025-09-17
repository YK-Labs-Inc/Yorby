"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import type {
  CandidateBasicData,
  CandidateImportantData,
  CandidateInterviewData,
} from "./actions";
import InterviewAnalysis from "./InterviewAnalysis";
import CandidateInfoSection from "./CandidateInfoSection";
import CandidateApplicationFilesSection from "./CandidateApplicationFilesSection";
import CandidateOverviewSkeleton from "./CandidateOverviewSkeleton";

interface CandidateOverviewProps {
  candidateBasicData?: CandidateBasicData | null;
  jobInterviewCount: number;
  loadingCandidateData: boolean;
  loadingImportantData?: boolean;
  importantDataError?: any;
  candidateImportantData?: CandidateImportantData | null;
  interviewDataError?: any;
  candidateInterviewData?: CandidateInterviewData | null;
  loadingInterviewData?: boolean;
  hasBasicDataError?: any;
  onBasicDataRetry?: () => void;
  onImportantDataRetry?: () => void;
  onInterviewDataRetry?: () => void;
  stageIds: string[];
  isPremium: boolean;
}

export default function CandidateOverview({
  candidateBasicData,
  jobInterviewCount,
  loadingCandidateData,
  loadingImportantData,
  importantDataError,
  candidateImportantData,
  interviewDataError,
  candidateInterviewData,
  loadingInterviewData,
  hasBasicDataError,
  onBasicDataRetry,
  onImportantDataRetry,
  onInterviewDataRetry,
  stageIds,
  isPremium,
}: CandidateOverviewProps) {
  const t = useTranslations("apply.recruiting.candidates.overview");
  // Show loading spinner only for initial basic data load
  if (loadingCandidateData) {
    return <CandidateOverviewSkeleton />;
  }

  if (hasBasicDataError || !candidateBasicData) {
    return (
      <Card className="h-full flex flex-col bg-white border shadow-sm rounded-l-none border-l-0">
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <AlertCircle className="h-8 w-8 text-red-500 mb-4" />
            <h3 className="text-sm font-medium mb-2">{t("error.title")}</h3>
            <p className="text-xs text-muted-foreground text-center mb-4">
              {t("error.description")}
            </p>
            {onBasicDataRetry && (
              <button
                onClick={onBasicDataRetry}
                className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="h-3 w-3" />
                {t("error.retry")}
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const configureImportantDataSection = () => {
    if (loadingImportantData) {
      return (
        <div className="space-y-6 px-6">
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-4 w-24 mb-4" />
        </div>
      );
    } else if (importantDataError) {
      return (
        <div className="space-y-6 px-6">
          <p className="text-sm text-muted-foreground">
            {t("error.importantData")}
          </p>
          {onImportantDataRetry && (
            <button
              onClick={onImportantDataRetry}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
              {t("error.description")}
            </button>
          )}
        </div>
      );
    } else if (!candidateImportantData) {
      return null;
    } else {
      return (
        <CandidateApplicationFilesSection
          candidateImportantData={candidateImportantData}
        />
      );
    }
  };

  const configureInterviewAnalysisSection = () => {
    if (loadingInterviewData) {
      return (
        <div className="space-y-6 px-6 py-4">
          <Skeleton className="h-6 w-48 mb-4" />
          <Skeleton className="h-32 w-full" />
        </div>
      );
    } else if (interviewDataError) {
      return (
        <div className="space-y-6 px-6">
          <p className="text-sm text-muted-foreground">
            {t("error.interviewData")}
          </p>
          {onInterviewDataRetry && (
            <button
              onClick={onInterviewDataRetry}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
              {t("error.description")}
            </button>
          )}
        </div>
      );
    } else if (!candidateInterviewData) {
      return null;
    } else {
      return (
        <InterviewAnalysis
          candidateBasicData={candidateBasicData}
          candidateImportantData={candidateImportantData}
          candidateInterviewData={candidateInterviewData}
          jobInterviewCount={jobInterviewCount}
          isPremium={isPremium}
        />
      );
    }
  };

  return (
    <Card className="h-full flex flex-col bg-white border shadow-sm rounded-l-none border-l-0">
      <CardContent className="flex-1 overflow-y-auto py-6 px-0">
        {/* Show basic info immediately */}
        <CandidateInfoSection
          candidateData={candidateBasicData}
          stageIds={stageIds}
        />

        <Separator className="my-6" />

        {/* Show files section with loading state */}
        {configureImportantDataSection()}

        {/* Show interview analysis with loading state */}
        {configureInterviewAnalysisSection()}
      </CardContent>
    </Card>
  );
}
