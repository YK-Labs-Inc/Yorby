"use client";

import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import { Tables } from "@/utils/supabase/database.types";

interface AggregatedHiringAnalysisProps {
  aggregatedAnalysis: Tables<"candidate_aggregated_interview_analysis">;
  interviewResultsCount: number;
}

export default function AggregatedHiringAnalysis({
  aggregatedAnalysis,
  interviewResultsCount,
}: AggregatedHiringAnalysisProps) {
  const t = useTranslations("apply.recruiting.candidates.analysis");

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-sm border border-slate-200 shadow-sm">
      <div className="p-6 space-y-4">
        {/* Header with Verdict */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">
              {t("aggregatedVerdict.title")}
            </h2>
            <div className="flex items-center gap-3">
              <Badge
                variant={
                  aggregatedAnalysis.hiring_verdict === "ADVANCE"
                    ? "success"
                    : aggregatedAnalysis.hiring_verdict === "REJECT"
                      ? "destructive"
                      : "secondary"
                }
                className="text-xs px-4 py-1.5"
              >
                {t(
                  `verdict.${aggregatedAnalysis.hiring_verdict.toLowerCase()}`
                )}
              </Badge>
            </div>
          </div>
          <div className="text-center">
            <div className="rounded-sm px-4 py-2">
              <div className="text-3xl font-bold">
                {aggregatedAnalysis.overall_score}%
              </div>
            </div>
          </div>
        </div>

        {/* Verdict Rationale */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            {t("aggregatedVerdict.rationale")}
          </h3>
          <div className="relative">
            <p className={`text-sm text-gray-700 whitespace-pre-wrap`}>
              {aggregatedAnalysis.verdict_rationale}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
