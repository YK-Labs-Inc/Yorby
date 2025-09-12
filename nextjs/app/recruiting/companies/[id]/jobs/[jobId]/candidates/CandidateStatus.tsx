"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import useSWR, { mutate } from "swr";
import useSWRMutation from "swr/mutation";
import { getCompanyStages, updateCandidateStage } from "./actions";
import { Tables } from "@/utils/supabase/database.types";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";

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
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { logError } = useAxiomLogging();

  // Fetch stages if interactive
  const { data: stages } = useSWR(["company-stages", companyId], () =>
    getCompanyStages(companyId!)
  );

  // Stage update mutation
  const { trigger } = useSWRMutation(
    ["candidate-stage", candidateId],
    (_, { arg }: { arg: { stageId: string | null } }) =>
      updateCandidateStage(candidateId, arg.stageId)
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

  const handleStageChange = async (
    newStage: Tables<"company_application_stages"> | null
  ) => {
    if (!candidateId) return;

    setIsOpen(false);

    try {
      await trigger({ stageId: newStage?.id || null });
      mutate(["candidates", companyId, jobId, stageIds]);
      mutate(["candidate-data", candidateId]);
    } catch (error) {
      logError("Failed to update stage:", { error });
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
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
      >
        {renderStageDisplay(stage, true)}
      </button>

      {isOpen && stages && (
        <div className="absolute z-50 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg">
          <div className="py-1">
            {stages.map((stageOption: Tables<"company_application_stages">) => (
              <button
                key={stageOption.id}
                onClick={() => handleStageChange(stageOption)}
                className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2"
              >
                <div
                  className="w-2.5 h-2.5 rounded-full border border-gray-200"
                  style={{ backgroundColor: stageOption.color || "#6B7280" }}
                />
                <span className="font-medium">{stageOption.name}</span>
                {stageOption.description && (
                  <span className="text-muted-foreground ml-auto truncate">
                    {stageOption.description}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
