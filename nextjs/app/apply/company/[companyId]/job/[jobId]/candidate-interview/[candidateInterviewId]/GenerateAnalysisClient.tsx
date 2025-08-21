"use client";

import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import useSWRMutation from "swr/mutation";

interface GenerateAnalysisClientProps {
  candidateId: string;
  companyId: string;
  jobId: string;
}

async function generateAnalysis(url: string) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to generate analysis");
  }

  return data;
}

export function GenerateAnalysisClient({
  candidateId,
  companyId,
  jobId,
}: GenerateAnalysisClientProps) {
  const router = useRouter();
  const t = useTranslations("apply.candidateInterview");

  const { trigger: triggerAggregatedAnalysis, isMutating: isGenerating } =
    useSWRMutation(
      `/api/company-job-candidates/${candidateId}/aggregated-analysis`,
      generateAnalysis,
      {
        onSuccess: () => {
          // Redirect to the submitted page after successful generation
          router.push(
            `/apply/company/${companyId}/job/${jobId}/application/submitted`
          );
        },
        onError: (error) => {
          const errorMessage =
            error instanceof Error ? error.message : t("errors.unknownError");
          toast.error(errorMessage);
        },
      }
    );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="mb-4">
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-semibold mb-2">
              {t("interviewComplete")}
            </h2>
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">{t("generatingAnalysis")}</p>
            </div>
            <p className="text-gray-600 mb-6">
              {t("interviewProcessed.complete")}
            </p>

            {isGenerating ? (
              <div className="flex flex-col items-center gap-2">
                <LoadingSpinner size="sm" />
              </div>
            ) : (
              <Button
                onClick={() => triggerAggregatedAnalysis()}
                disabled={isGenerating}
                className="w-full"
              >
                {t("buttons.completeApplication")}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
