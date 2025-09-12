"use client";

import { useCallback } from "react";
import { ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import useSWR from "swr";
import { getCompanyStages } from "./actions";
import { Tables } from "@/utils/supabase/database.types";

interface CandidateStatusFilterProps {
  companyId: string;
  selectedStageIds: string[];
  onFilterChange: (stageIds: string[]) => void;
  className?: string;
}

export function CandidateStatusFilter({
  companyId,
  selectedStageIds,
  onFilterChange,
  className,
}: CandidateStatusFilterProps) {
  const t = useTranslations("apply.recruiting.candidates.filters");

  // Fetch company stages
  const { data: stages = [] } = useSWR(["company-stages", companyId], () =>
    getCompanyStages(companyId)
  );

  const handleStageToggle = useCallback(
    (stageId: string) => {
      const newSelected = selectedStageIds.includes(stageId)
        ? selectedStageIds.filter((id) => id !== stageId)
        : [...selectedStageIds, stageId];

      onFilterChange(newSelected);
    },
    [selectedStageIds, onFilterChange]
  );

  const handleClearAll = useCallback(() => {
    onFilterChange([]);
  }, [onFilterChange]);

  const handleSelectAll = useCallback(() => {
    const allStageIds = stages.map((stage) => stage.id);
    onFilterChange(allStageIds);
  }, [stages, onFilterChange]);

  const selectedStages = stages.filter((stage) =>
    selectedStageIds.includes(stage.id)
  );

  const isAllSelected = selectedStageIds.length === 0;

  const getDisplayText = () => {
    if (isAllSelected) {
      return t("allStages");
    }
    if (selectedStages.length === 1) {
      return selectedStages[0].name;
    }
    return t("stagesSelected", { count: selectedStages.length });
  };

  const displayText = getDisplayText();
  const showBadge = !isAllSelected;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 gap-1.5 px-2 text-sm font-normal text-gray-600 hover:text-gray-900 hover:bg-gray-50",
            "border border-transparent hover:border-gray-200 transition-all duration-200",
            showBadge && "pr-2",
            className
          )}
        >
          <span className="text-gray-500">{displayText}</span>
          {showBadge && (
            <Badge
              variant="secondary"
              className="ml-1 h-5 px-1.5 text-xs font-normal bg-gray-100 text-gray-400 hover:bg-gray-100"
            >
              {selectedStages.length}
            </Badge>
          )}
          <ChevronDown className="h-3 w-3 text-gray-400" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuPortal>
        <DropdownMenuContent
          className="w-56 z-[100]"
          align="start"
          sideOffset={5}
        >
        {/* Header */}
        <div className="flex items-center justify-between px-2 pb-1">
          <DropdownMenuLabel className="text-xs font-medium text-gray-700 uppercase tracking-wider p-0">
            {t("filterByStage")}
          </DropdownMenuLabel>
          {!isAllSelected && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="h-auto p-0 text-xs text-gray-400 hover:text-gray-600 hover:bg-transparent"
            >
              {t("clear")}
            </Button>
          )}
        </div>

        <DropdownMenuSeparator className="mb-1" />

        <DropdownMenuGroup>
          {/* All stages option */}
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              onFilterChange([]);
            }}
            className={cn(
              "flex items-center gap-2.5 px-2 py-1.5",
              isAllSelected && "bg-gray-50"
            )}
          >
            <div className="flex items-center justify-center w-3.5 h-3.5">
              {isAllSelected && <Check className="h-3 w-3 text-gray-600" />}
            </div>
            <span className="font-normal flex-1">{t("allStages")}</span>
            <span className="text-xs text-gray-400">{stages.length}</span>
          </DropdownMenuItem>

          {/* Individual stage options */}
          {stages.map((stage: Tables<"company_application_stages">) => {
            const isSelected = selectedStageIds.includes(stage.id);

            return (
              <DropdownMenuItem
                key={stage.id}
                onSelect={(e) => {
                  e.preventDefault();
                  handleStageToggle(stage.id);
                }}
                className={cn(
                  "flex items-center gap-2.5 px-2 py-1.5",
                  isSelected && "bg-gray-50"
                )}
              >
                <div className="flex items-center justify-center w-3.5 h-3.5">
                  {isSelected && <Check className="h-3 w-3 text-gray-600" />}
                </div>
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: stage.color || "#6B7280" }}
                />
                <span className="font-normal truncate flex-1">
                  {stage.name}
                </span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>

        {/* Footer */}
        {stages.length > 0 &&
          selectedStages.length > 0 &&
          selectedStages.length < stages.length && (
            <>
              <DropdownMenuSeparator className="mt-1" />
              <div className="flex items-center justify-between px-2 py-2">
                <span className="text-xs text-gray-400">
                  {t("selectedCount", {
                    selected: selectedStages.length,
                    total: stages.length,
                  })}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="h-auto p-0 text-xs text-gray-500 hover:text-gray-700 hover:bg-transparent"
                >
                  {t("selectAll")}
                </Button>
              </div>
            </>
          )}
      </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
}
