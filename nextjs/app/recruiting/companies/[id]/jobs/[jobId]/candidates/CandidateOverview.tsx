"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import type { CandidateData } from "./actions";
import InterviewAnalysis from "./InterviewAnalysis";
import CandidateInfoSection from "./CandidateInfoSection";
import CandidateApplicationFilesSection from "./CandidateApplicationFilesSection";

interface CandidateOverviewProps {
  candidateData: CandidateData;
  jobInterviewCount: number;
  loadingCandidateData: boolean;
}

export default function CandidateOverview({
  candidateData,
  jobInterviewCount,
  loadingCandidateData,
}: CandidateOverviewProps) {
  if (loadingCandidateData) {
    return (
      <Card className="h-full flex flex-col bg-white border shadow-sm rounded-l-none border-l-0">
        <CardContent className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
