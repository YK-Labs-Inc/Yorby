"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { CandidateData } from "./actions";
import { useTranslations } from "next-intl";
import InterviewAnalysis from "./InterviewAnalysis";
import CandidateInfoSection from "./CandidateInfoSection";

interface CandidateOverviewProps {
  candidateData: CandidateData;
}

export default function CandidateOverview({
  candidateData,
}: CandidateOverviewProps) {
  const t = useTranslations("apply.recruiting.candidates.overview");
  const { candidate, interviewAnalysis } = candidateData;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    return t("appliedOn", { date });
  };

  return (
    <Card className="h-full flex flex-col bg-white border shadow-sm rounded-l-none border-l-0">
      <CardHeader className="flex-shrink-0 border-b">
        <div>
          <CardTitle className="text-2xl break-words">
            {candidate.candidate_name}
          </CardTitle>
          <CardDescription className="break-words">
            {formatDate(candidate.applied_at)}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto py-6 px-0">
        <CandidateInfoSection candidateData={candidateData} />

        <Separator className="my-6" />

        <InterviewAnalysis
          analysis={interviewAnalysis}
          candidateData={candidateData}
        />
      </CardContent>
    </Card>
  );
}
