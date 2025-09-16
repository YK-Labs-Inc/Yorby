"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import useSWR from "swr";
import { getCompanyStages } from "./actions";
import { Tables } from "@/utils/supabase/database.types";
import { useCandidateStage } from "./CandidateStageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";

interface CandidateStatusProps {
  stage: Tables<"company_application_stages"> | null;
  className?: string;
  candidateId: string;
  companyId: string;
  jobId: string;
  stageIds: string[];
}

export function CandidateStatus({
  stage,
  className,
  candidateId,
  companyId,
  jobId,
  stageIds,
}: CandidateStatusProps) {
  const t = useTranslations("apply.status");
  const { updateCandidateStage, getCandidateStage } = useCandidateStage();

  // Get the optimistic stage value
  const effectiveStage = getCandidateStage(candidateId, stage);

  // Fetch stages if interactive
  const { data: stages } = useSWR(["company-stages", companyId], () =>
    getCompanyStages(companyId!)
  );

  const handleStageChange = async (
    newStage: Tables<"company_application_stages"> | null
  ) => {
    if (!candidateId) return;

    try {
      await updateCandidateStage(
        candidateId,
        newStage,
        companyId,
        jobId,
        stageIds
      );
    } catch (error) {
      // Error is already logged in the context
    }
  };

  const renderStageDisplay = (
    currentStage: Tables<"company_application_stages"> | null,
    showChevron = false
  ) => {
    if (!currentStage) {
      return (
        <Badge
          variant="secondary"
          className={cn("text-xs", showChevron && "pr-1", className)}
        >
          {t("noStage")}
          {showChevron && <ChevronDown className="ml-1 h-3 w-3" />}
        </Badge>
      );
    }

    const stageColor = currentStage.color || "#6B7280";

    // Default badge variant
    return (
      <Badge
        variant="outline"
        className={cn(
          "text-xs font-medium border",
          "bg-opacity-10 hover:bg-opacity-20 transition-colors",
          showChevron && "pr-1",
          className
        )}
        style={{
          backgroundColor: `${stageColor}15`,
          borderColor: stageColor,
          color: stageColor,
        }}
      >
        {currentStage.name}
        {showChevron && <ChevronDown className="ml-1 h-3 w-3" />}
      </Badge>
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded">
          {renderStageDisplay(effectiveStage, true)}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuPortal>
        <DropdownMenuContent
          className="w-48 z-[100]"
          align="start"
          sideOffset={5}
        >
          {stages?.map((stageOption: Tables<"company_application_stages">) => (
            <DropdownMenuItem
              key={stageOption.id}
              onSelect={() => handleStageChange(stageOption)}
              className="flex items-center gap-2 text-xs"
            >
              <div
                className="w-2.5 h-2.5 rounded-full border border-gray-200 flex-shrink-0"
                style={{ backgroundColor: stageOption.color || "#6B7280" }}
              />
              <span className="font-medium">{stageOption.name}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
}
