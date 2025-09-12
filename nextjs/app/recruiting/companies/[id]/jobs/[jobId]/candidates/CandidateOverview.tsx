"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import type { CandidateData } from "./actions";
import InterviewAnalysis from "./InterviewAnalysis";
import CandidateInfoSection from "./CandidateInfoSection";
import CandidateApplicationFilesSection from "./CandidateApplicationFilesSection";

interface CandidateOverviewProps {
  candidateData: CandidateData | null;
  jobInterviewCount: number;
  loadingCandidateData: boolean;
  hasError?: any;
  onRetry?: () => void;
}

export default function CandidateOverview({
  candidateData,
  jobInterviewCount,
  loadingCandidateData,
  hasError,
  onRetry,
}: CandidateOverviewProps) {
  const t = useTranslations("apply.recruiting.candidates.overview");
  if (hasError) {
    return (
      <Card className="h-full flex flex-col bg-white border shadow-sm rounded-l-none border-l-0">
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <AlertCircle className="h-8 w-8 text-red-500 mb-4" />
            <h3 className="text-sm font-medium mb-2">{t("error.title")}</h3>
            <p className="text-xs text-muted-foreground text-center mb-4">
              {t("error.description")}
            </p>
            {onRetry && (
              <button
                onClick={onRetry}
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

  if (loadingCandidateData) {
    return (
      <Card className="h-full flex flex-col bg-white border shadow-sm rounded-l-none border-l-0">
        <CardContent className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!candidateData) {
    return (
      <Card className="h-full flex flex-col bg-white border shadow-sm rounded-l-none border-l-0">
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">No candidate selected</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col bg-white border shadow-sm rounded-l-none border-l-0">
      <CardContent className="flex-1 overflow-y-auto py-6 px-0">
        <CandidateInfoSection candidateData={candidateData} />

        <Separator className="my-6" />

        <CandidateApplicationFilesSection candidateData={candidateData} />

        <InterviewAnalysis
          candidateData={candidateData}
          jobInterviewCount={jobInterviewCount}
        />
      </CardContent>
    </Card>
  );
}
