"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { Tables } from "@/utils/supabase/database.types";
import { updateCandidateStage } from "./actions";
import { mutate } from "swr";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";

interface StageUpdate {
  candidateId: string;
  stage: Tables<"company_application_stages"> | null;
  timestamp: number;
}

interface CandidateStageContextValue {
  stageUpdates: Map<string, StageUpdate>;
  updateCandidateStage: (
    candidateId: string,
    newStage: Tables<"company_application_stages"> | null,
    companyId: string,
    jobId: string,
    stageIds?: string[]
  ) => Promise<void>;
  getCandidateStage: (
    candidateId: string,
    originalStage: Tables<"company_application_stages"> | null
  ) => Tables<"company_application_stages"> | null;
}

const CandidateStageContext = createContext<
  CandidateStageContextValue | undefined
>(undefined);

export function CandidateStageProvider({ children }: { children: ReactNode }) {
  const [stageUpdates, setStageUpdates] = useState<Map<string, StageUpdate>>(
    new Map()
  );
  const { logError, logInfo } = useAxiomLogging();

  // Helper function to revalidate relevant SWR caches
  const revalidateCandidateCaches = useCallback(
    (
      candidateId: string,
      companyId: string,
      jobId: string,
      stageIds?: string[]
    ) => {
      mutate((key) => {
        if (!Array.isArray(key)) return false;

        // Revalidate candidates list - check all pagination keys
        // Cache key format: ["candidates", companyId, jobId, stageIds, offset]
        if (
          key[0] === "candidates" &&
          key[1] === companyId &&
          key[2] === jobId &&
          // Check if stageIds match (both could be arrays or undefined)
          (Array.isArray(key[3]) && Array.isArray(stageIds) 
            ? key[3].join(",") === stageIds.join(",")
            : key[3] === stageIds) &&
          typeof key[4] === "number" // offset for pagination
        ) {
          return true;
        }

        // Revalidate individual candidate data
        if (key[0] === "candidate-data" && key[1] === candidateId) {
          return true;
        }

        return false;
      });
    },
    []
  );

  const updateCandidateStageOptimistically = useCallback(
    async (
      candidateId: string,
      newStage: Tables<"company_application_stages"> | null,
      companyId: string,
      jobId: string,
      stageIds?: string[]
    ) => {
      // Store the optimistic update
      const update: StageUpdate = {
        candidateId,
        stage: newStage,
        timestamp: Date.now(),
      };

      setStageUpdates((prev) => {
        const newMap = new Map(prev);
        newMap.set(candidateId, update);
        return newMap;
      });

      logInfo("Optimistic stage update", {
        candidateId,
        newStageId: newStage?.id,
        newStageName: newStage?.name,
      });

      try {
        // Perform the actual update
        await updateCandidateStage(candidateId, newStage?.id || null);

        // After successful update, trigger revalidation
        // This will fetch fresh data from the server
        revalidateCandidateCaches(candidateId, companyId, jobId, stageIds);

        logInfo("Stage update successful", {
          candidateId,
          newStageId: newStage?.id,
        });
      } catch (error) {
        logError("Failed to update candidate stage", {
          error,
          candidateId,
          newStageId: newStage?.id,
        });

        // Remove the optimistic update on error
        setStageUpdates((prev) => {
          const newMap = new Map(prev);
          newMap.delete(candidateId);
          return newMap;
        });

        // Force revalidation to restore correct state
        revalidateCandidateCaches(candidateId, companyId, jobId, stageIds);

        throw error;
      }
    },
    [logError, logInfo, revalidateCandidateCaches]
  );

  const getCandidateStage = useCallback(
    (
      candidateId: string,
      originalStage: Tables<"company_application_stages"> | null
    ): Tables<"company_application_stages"> | null => {
      const update = stageUpdates.get(candidateId);
      return update ? update.stage : originalStage;
    },
    [stageUpdates]
  );

  return (
    <CandidateStageContext.Provider
      value={{
        stageUpdates,
        updateCandidateStage: updateCandidateStageOptimistically,
        getCandidateStage,
      }}
    >
      {children}
    </CandidateStageContext.Provider>
  );
}

export function useCandidateStage() {
  const context = useContext(CandidateStageContext);
  if (!context) {
    throw new Error(
      "useCandidateStage must be used within CandidateStageProvider"
    );
  }
  return context;
}
