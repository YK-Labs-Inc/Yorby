"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, User, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Candidate } from "./actions";
import { useTranslations } from "next-intl";
import { FREE_TIER_INTERVIEW_COUNT } from "./constants";
import { CandidateLimitUpgradeDialog } from "./CandidateLimitUpgradeDialog";
import { CandidateStatus } from "./CandidateStatus";
import { CandidateStatusFilter } from "./CandidateStatusFilter";
import { Tables } from "@/utils/supabase/database.types";

interface CandidatesListProps {
  candidates: Candidate[];
  companyId: string;
  jobId: string;
  selectedCandidateId?: string;
  isPremium: boolean;
  companyCandidateCount: number;
  isLoading: boolean;
  loadingError?: any;
  onRetry?: () => void;
  selectCandidate?: (candidateId: string) => void;
  stageIds: string[];
  onLoadMore: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
}

export default function CandidatesList({
  candidates,
  companyId,
  jobId,
  selectedCandidateId,
  isPremium,
  companyCandidateCount,
  isLoading,
  loadingError,
  onRetry,
  selectCandidate,
  stageIds,
  onLoadMore,
  hasMore,
  isLoadingMore,
}: CandidatesListProps) {
  const t = useTranslations("apply.recruiting.candidates.list");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStageIds, setSelectedStageIds] = useState<string[]>([]);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastCandidateRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize filter state from URL parameters
  useEffect(() => {
    const stageIdsFromUrl = searchParams.get("stageIds");
    if (stageIdsFromUrl) {
      setSelectedStageIds(stageIdsFromUrl.split(","));
    }
  }, [searchParams]);

  const handleCandidateSelect = (candidateId: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("candidateId", candidateId);
    router.push(`?${params.toString()}`, { scroll: false });
    selectCandidate?.(candidateId);
  };

  const openUpgradeDialog = useCallback(() => {
    setShowUpgradeDialog(true);
  }, []);

  const handleFilterChange = useCallback(
    (stageIds: string[]) => {
      setSelectedStageIds(stageIds);

      // Update URL parameters
      const params = new URLSearchParams(searchParams);
      if (stageIds.length === 0) {
        params.delete("stageIds");
      } else {
        params.set("stageIds", stageIds.join(","));
      }
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const loadMoreCandidates = useCallback(() => {
    if (isLoadingMore || !hasMore) return;

    // Check free tier limit
    if (!isPremium && candidates.length >= FREE_TIER_INTERVIEW_COUNT) {
      openUpgradeDialog();
      return;
    }

    onLoadMore();
  }, [isLoadingMore, hasMore, isPremium, candidates.length, onLoadMore, openUpgradeDialog]);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Don't set up observer if free tier limit reached
    const shouldObserve =
      isPremium || candidates.length < FREE_TIER_INTERVIEW_COUNT;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMore &&
          !isLoadingMore &&
          shouldObserve
        ) {
          loadMoreCandidates();
        }
      },
      { threshold: 0.1 }
    );

    if (lastCandidateRef.current) {
      observerRef.current.observe(lastCandidateRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [
    loadMoreCandidates,
    hasMore,
    isLoadingMore,
    isPremium,
    candidates.length,
  ]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    return t("applied", { date });
  };

  const filteredCandidates = candidates.filter(
    (candidate) =>
      candidate.candidateName
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      candidate.candidateEmail
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-1/4 max-w-[320px] min-w-[240px] flex-shrink-0">
      <Card className="h-full flex flex-col border shadow-none rounded-r-none">
        <CardHeader className="pb-3 flex-shrink-0 border-b">
          <CardTitle className="text-lg">
            {t("title", { count: candidates.length })}
          </CardTitle>
          <div className="mt-3 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <CandidateStatusFilter
              companyId={companyId}
              selectedStageIds={selectedStageIds}
              onFilterChange={handleFilterChange}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 min-h-0">
          <div className="h-full overflow-y-auto">
            {loadingError ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <AlertCircle className="h-8 w-8 text-red-500 mb-4" />
                <h3 className="text-sm font-medium mb-2">{t("errorTitle")}</h3>
                <p className="text-xs text-muted-foreground text-center mb-4">
                  {t("errorMessage")}
                </p>
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <RefreshCw className="h-3 w-3" />
                    {t("retry")}
                  </button>
                )}
              </div>
            ) : isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
              </div>
            ) : filteredCandidates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <User className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-sm font-medium mb-2">
                  {t("noCandidates")}
                </h3>
                <p className="text-xs text-muted-foreground text-center">
                  {searchQuery ? t("noMatches") : t("noApplicants")}
                </p>
              </div>
            ) : (
              <div>
                {filteredCandidates.map((candidate, index) => (
                  <div
                    key={candidate.id}
                    ref={
                      index === filteredCandidates.length - 1
                        ? lastCandidateRef
                        : null
                    }
                    className={cn(
                      "px-4 py-3 cursor-pointer transition-colors border-b",
                      "hover:bg-gray-50",
                      selectedCandidateId === candidate.id
                        ? "bg-gray-50"
                        : "bg-white",
                      index === filteredCandidates.length - 1 && "border-b-0"
                    )}
                    onClick={() => handleCandidateSelect(candidate.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {candidate.candidateName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {candidate.candidateEmail}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-muted-foreground">
                          {formatDate(candidate.applied_at)}
                        </p>
                        <CandidateStatus
                          stage={candidate.currentStage}
                          candidateId={candidate.id}
                          companyId={companyId}
                          jobId={jobId}
                          stageIds={stageIds}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {isLoadingMore && (
                  <div className="p-3 text-center text-sm text-muted-foreground">
                    {t("loadingMore")}
                  </div>
                )}
                {!isPremium &&
                  candidates.length >= FREE_TIER_INTERVIEW_COUNT &&
                  hasMore && (
                    <div className="p-4 text-center border-t">
                      <p className="text-xs text-muted-foreground mb-2">
                        {t("list.freeTier.limitReached", {
                          limit: FREE_TIER_INTERVIEW_COUNT,
                        })}
                      </p>
                      {companyCandidateCount > FREE_TIER_INTERVIEW_COUNT && (
                        <p className="text-xs font-medium text-foreground mb-2">
                          {t("list.freeTier.moreCandidates", {
                            count:
                              companyCandidateCount - FREE_TIER_INTERVIEW_COUNT,
                          })}
                        </p>
                      )}
                      <button
                        onClick={openUpgradeDialog}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        {t("list.freeTier.upgradeToViewAll", {
                          count: companyCandidateCount,
                        })}
                      </button>
                    </div>
                  )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <CandidateLimitUpgradeDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        companyId={companyId}
        totalCandidates={companyCandidateCount}
        viewedCandidates={candidates.length}
      />
    </div>
  );
}
