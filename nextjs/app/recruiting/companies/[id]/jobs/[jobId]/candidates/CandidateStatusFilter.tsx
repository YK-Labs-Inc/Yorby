"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch company stages
  const { data: stages = [] } = useSWR(["company-stages", companyId], () =>
    getCompanyStages(companyId)
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    setIsOpen(false);
  }, [onFilterChange]);

  const handleSelectAll = useCallback(() => {
    const allStageIds = stages.map((stage) => stage.id);
    onFilterChange(allStageIds);
  }, [stages, onFilterChange]);

  const selectedStages = stages.filter((stage) =>
    selectedStageIds.includes(stage.id)
  );

  const isAllSelected = selectedStageIds.length === 0;
  const hasMultipleSelected = selectedStages.length > 1;

  const getDisplayText = () => {
    if (isAllSelected) {
      return t("allStages");
    }
    if (selectedStages.length === 1) {
      return selectedStages[0].name;
    }
    return t("stagesSelected", { count: selectedStages.length });
  };

  const getFilterButton = () => {
    const displayText = getDisplayText();
    const showBadge = !isAllSelected;

    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-8 gap-1.5 px-2 text-sm font-normal text-gray-600 hover:text-gray-900 hover:bg-gray-50",
          "border border-transparent hover:border-gray-200 transition-all duration-200",
          showBadge && "pr-2",
          className
        )}
      >
        <span className="text-gray-500">{displayText}</span>
        {showBadge && (
          <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
            {selectedStages.length}
          </span>
        )}
        <ChevronDown className="h-3 w-3 text-gray-400" />
      </Button>
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {getFilterButton()}

      {isOpen && (
        <div className="absolute z-50 mt-2 w-56 bg-white border border-gray-100 rounded-lg shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-50">
            <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wider">
              {t("filterByStage")}
            </h4>
            {!isAllSelected && (
              <button
                onClick={handleClearAll}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                {t("clear")}
              </button>
            )}
          </div>

          {/* Options */}
          <div className="p-2">
            {/* All stages option */}
            <button
              onClick={() => onFilterChange([])}
              className={cn(
                "w-full flex items-center gap-2.5 px-2 py-1.5 text-sm rounded-md transition-colors",
                "hover:bg-gray-50",
                isAllSelected ? "bg-gray-50 text-gray-900" : "text-gray-700"
              )}
            >
              <div className="flex items-center justify-center w-3.5 h-3.5">
                {isAllSelected && <Check className="h-3 w-3 text-gray-600" />}
              </div>
              <span className="font-normal">{t("allStages")}</span>
              <span className="ml-auto text-xs text-gray-400">
                {stages.length}
              </span>
            </button>

            {/* Individual stage options */}
            {stages.map((stage: Tables<"company_application_stages">) => {
              const isSelected = selectedStageIds.includes(stage.id);

              return (
                <button
                  key={stage.id}
                  onClick={() => handleStageToggle(stage.id)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-2 py-1.5 text-sm rounded-md transition-colors",
                    "hover:bg-gray-50",
                    isSelected ? "bg-gray-50 text-gray-900" : "text-gray-700"
                  )}
                >
                  <div className="flex items-center justify-center w-3.5 h-3.5">
                    {isSelected && <Check className="h-3 w-3 text-gray-600" />}
                  </div>
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: stage.color || "#6B7280" }}
                  />
                  <span className="font-normal truncate">{stage.name}</span>
                </button>
              );
            })}
          </div>

          {/* Footer */}
          {stages.length > 0 &&
            selectedStages.length > 0 &&
            selectedStages.length < stages.length && (
              <div className="flex items-center justify-between px-3 py-2 border-t border-gray-50">
                <span className="text-xs text-gray-400">
                  {t("selectedCount", {
                    selected: selectedStages.length,
                    total: stages.length,
                  })}
                </span>
                <button
                  onClick={handleSelectAll}
                  className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {t("selectAll")}
                </button>
              </div>
            )}
        </div>
      )}
    </div>
  );
}
