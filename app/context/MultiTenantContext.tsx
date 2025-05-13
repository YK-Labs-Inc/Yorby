"use client";

import React, {
  createContext,
  useContext,
  useMemo,
  ReactNode,
  useState,
  useEffect,
  useTransition,
} from "react";
import { useParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";
import { Tables } from "@/utils/supabase/database.types"; // Import Database type
import { useAxiomLogging } from "@/context/AxiomLoggingContext";

interface MultiTenantContextProps {
  isCoachPath: boolean;
  coachBrandingSettings: Tables<"coach_branding"> | null; // Use the specific row type
  isLoadingBranding: boolean;
  baseUrl: string;
}

const MultiTenantContext = createContext<MultiTenantContextProps | undefined>(
  undefined
);

export const MultiTenantProvider = ({ children }: { children: ReactNode }) => {
  const params = useParams();
  const coachSlug = params?.coachSlug;
  const [isLoadingBranding, startTransition] = useTransition();
  const [coachBrandingSettings, setCoachBrandingSettings] =
    useState<Tables<"coach_branding"> | null>(null);
  const [baseUrl, setBaseUrl] = useState<string>("");
  const { logError } = useAxiomLogging();

  const isCoachPath = useMemo(() => {
    return typeof coachSlug === "string" && coachSlug.length > 0;
  }, [coachSlug]);

  useEffect(() => {
    if (isCoachPath) {
      setBaseUrl(`/coaches/${coachSlug}/curriculum`);
    } else {
      setBaseUrl(`/dashboard/jobs`);
    }
  }, [isCoachPath]);

  useEffect(() => {
    if (isCoachPath && typeof coachSlug === "string") {
      startTransition(async () => {
        const supabase = createSupabaseBrowserClient();
        setCoachBrandingSettings(null); // Reset on new fetch
        try {
          // 1. Fetch coach ID based on custom_domain (slug)
          const { data: coachData, error: coachError } = await supabase
            .from("coaches")
            .select("coach_branding(*)") // Select only the ID
            .eq("slug", coachSlug)
            .maybeSingle();

          if (coachError || !coachData) {
            logError("Error fetching coach or coach not found:", {
              error: coachError,
              coachData,
            });
            return; // Exit if coach not found or error occurred
          }
          setCoachBrandingSettings(coachData.coach_branding ?? null); // Set branding data or null if not found
        } catch (err) {
          logError("Unexpected error fetching coach branding:", {
            error: err,
          });
          setCoachBrandingSettings(null); // Ensure state is reset on unexpected error
        }
      });
    } else {
      setCoachBrandingSettings(null);
    }
  }, [coachSlug, isCoachPath, logError]);

  const value = useMemo(
    () => ({
      isCoachPath,
      coachBrandingSettings,
      isLoadingBranding,
      baseUrl,
    }),
    [isCoachPath, coachBrandingSettings, isLoadingBranding, baseUrl]
  );

  return (
    <MultiTenantContext.Provider value={value}>
      {children}
    </MultiTenantContext.Provider>
  );
};

export const useMultiTenant = (): MultiTenantContextProps => {
  const context = useContext(MultiTenantContext);
  if (context === undefined) {
    throw new Error("useMultiTenant must be used within a MultiTenantProvider");
  }
  return context;
};
