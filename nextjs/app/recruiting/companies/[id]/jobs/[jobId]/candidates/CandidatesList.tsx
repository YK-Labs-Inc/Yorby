"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Candidate, fetchMoreCandidates } from "./actions";
import { useTranslations } from "next-intl";
import { FREE_TIER_CANDIDATE_COUNT } from "./constants";
import { CandidateLimitUpgradeDialog } from "./CandidateLimitUpgradeDialog";

interface CandidatesListProps {
  initialCandidates: Candidate[];
  companyId: string;
  jobId: string;
  selectedCandidateId?: string;
  isPremium: boolean;
  companyCandidateCount: number;
}

export default function CandidatesList({
  initialCandidates,
  companyId,
  jobId,
  selectedCandidateId,
  isPremium,
  companyCandidateCount,
}: CandidatesListProps) {
  const t = useTranslations("apply.recruiting.candidates.list");
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialCandidates.length === 10);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastCandidateRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleCandidateSelect = (candidateId: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("candidateId", candidateId);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const openUpgradeDialog = useCallback(() => {
    setShowUpgradeDialog(true);
  }, []);

  const loadMoreCandidates = useCallback(async () => {
    if (isLoading || !hasMore) return;

    // Check free tier limit
    if (!isPremium && candidates.length >= FREE_TIER_CANDIDATE_COUNT) {
      openUpgradeDialog();
      return;
    }

    setIsLoading(true);
    try {
      const moreCandidates = await fetchMoreCandidates(
        companyId,
        jobId,
        candidates.length
      );

      if (moreCandidates.length < 10) {
        setHasMore(false);
      }

      setCandidates((prev) => [...prev, ...moreCandidates]);
    } catch (error) {
      console.error("Error loading more candidates:", error);
    } finally {
      setIsLoading(false);
    }
  }, [
    candidates.length,
    companyId,
    jobId,
    hasMore,
    isLoading,
    isPremium,
    openUpgradeDialog,
  ]);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Don't set up observer if free tier limit reached
    const shouldObserve =
      isPremium || candidates.length < FREE_TIER_CANDIDATE_COUNT;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMore &&
          !isLoading &&
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
  }, [loadMoreCandidates, hasMore, isLoading, isPremium, candidates.length]);

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
          <div className="mt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 min-h-0">
          <div className="h-full overflow-y-auto">
            {filteredCandidates.length === 0 ? (
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
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(candidate.applied_at)}
                      </p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="p-3 text-center text-sm text-muted-foreground">
                    {t("loadingMore")}
                  </div>
                )}
                {!isPremium &&
                  candidates.length >= FREE_TIER_CANDIDATE_COUNT &&
                  hasMore && (
                    <div className="p-4 text-center border-t">
                      <p className="text-xs text-muted-foreground mb-2">
                        {t("list.freeTier.limitReached", {
                          limit: FREE_TIER_CANDIDATE_COUNT,
                        })}
                      </p>
                      {companyCandidateCount > FREE_TIER_CANDIDATE_COUNT && (
                        <p className="text-xs font-medium text-foreground mb-2">
                          {t("list.freeTier.moreCandidates", {
                            count:
                              companyCandidateCount - FREE_TIER_CANDIDATE_COUNT,
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
