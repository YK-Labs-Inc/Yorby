"use client";

import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { Tables } from "@/utils/supabase/database.types";

interface JobAlignmentDetailsProps {
  alignmentDetails: Tables<"candidate_job_alignment_details"> | null;
}

export default function JobAlignmentDetails({
  alignmentDetails,
}: JobAlignmentDetailsProps) {
  const t = useTranslations(
    "apply.recruiting.candidates.analysis.jobAlignment"
  );

  if (!alignmentDetails) {
    return null;
  }

  const getScoreVariant = (score: number) => {
    if (score >= 80) return "success";
    if (score >= 60) return "secondary";
    return "destructive";
  };

  return (
    <div className="bg-white rounded-sm border border-gray-200 shadow-sm">
      <div className="p-6 space-y-4">
        {/* Header with Alignment Score */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-gray-900">
              {t("title")}
            </h2>
            <Badge
              variant={getScoreVariant(alignmentDetails.alignment_score)}
              className="text-xs mt-1"
            >
              {t(
                `scoreLabel.${getScoreVariant(alignmentDetails.alignment_score)}`
              )}
            </Badge>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">
              {alignmentDetails.alignment_score}%
            </div>
          </div>
        </div>

        {/* Requirements Pills */}
        <div className="space-y-3">
          {/* Matched Requirements */}
          {alignmentDetails.matched_requirements &&
            alignmentDetails.matched_requirements.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <h3 className="text-sm font-semibold text-gray-700">
                    {t("matched")} (
                    {alignmentDetails.matched_requirements.length})
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {alignmentDetails.matched_requirements
                    .slice(0, 5)
                    .map((req, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1.5 bg-white border border-gray-200 border-l-4 border-l-green-500 rounded-sm text-xs text-gray-700"
                      >
                        {req}
                      </span>
                    ))}
                  {alignmentDetails.matched_requirements.length > 5 && (
                    <span className="inline-flex items-center px-3 py-1.5 bg-white border border-gray-200 rounded-sm text-xs text-gray-500">
                      +{alignmentDetails.matched_requirements.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            )}

          {/* Missing Requirements */}
          {alignmentDetails.missing_requirements &&
            alignmentDetails.missing_requirements.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <h3 className="text-sm font-semibold text-gray-700">
                    {t("missing")} (
                    {alignmentDetails.missing_requirements.length})
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {alignmentDetails.missing_requirements
                    .slice(0, 5)
                    .map((req, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1.5 bg-white border border-gray-200 border-l-4 border-l-red-500 rounded-sm text-xs text-gray-700"
                      >
                        {req}
                      </span>
                    ))}
                  {alignmentDetails.missing_requirements.length > 5 && (
                    <span className="inline-flex items-center px-3 py-1.5 bg-white border border-gray-200 rounded-sm text-xs text-gray-500">
                      +{alignmentDetails.missing_requirements.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            )}

          {/* Exceeded Requirements */}
          {alignmentDetails.exceeded_requirements &&
            alignmentDetails.exceeded_requirements.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-semibold text-gray-700">
                    {t("exceeded")} (
                    {alignmentDetails.exceeded_requirements.length})
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {alignmentDetails.exceeded_requirements
                    .slice(0, 5)
                    .map((req, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1.5 bg-white border border-gray-200 border-l-4 border-l-blue-500 rounded-sm text-xs text-gray-700"
                      >
                        {req}
                      </span>
                    ))}
                  {alignmentDetails.exceeded_requirements.length > 5 && (
                    <span className="inline-flex items-center px-3 py-1.5 bg-white border border-gray-200 rounded-sm text-xs text-gray-500">
                      +{alignmentDetails.exceeded_requirements.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            )}

          {/* Empty State */}
          {(!alignmentDetails.matched_requirements ||
            alignmentDetails.matched_requirements.length === 0) &&
            (!alignmentDetails.missing_requirements ||
              alignmentDetails.missing_requirements.length === 0) &&
            (!alignmentDetails.exceeded_requirements ||
              alignmentDetails.exceeded_requirements.length === 0) && (
              <div className="bg-gray-50 rounded-sm p-4">
                <p className="text-sm text-gray-500 text-center">
                  {t("noRequirementsData")}
                </p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
