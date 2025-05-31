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
import { useParams, usePathname } from "next/navigation";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";
import { Tables } from "@/utils/supabase/database.types"; // Import Database type
import { useAxiomLogging } from "@/context/AxiomLoggingContext";

// Custom hook to get hostname
const useHostname = (): string => {
  const [hostname, setHostname] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHostname(window.location.hostname);
    }
  }, []);

  return hostname;
};

interface MultiTenantContextProps {
  isCoachPath: boolean;
  isCoachProgramsPage: boolean;
  isCoachHomePage: boolean;
  coachBrandingSettings: Tables<"coach_branding"> | null; // Use the specific row type
  isLoadingBranding: boolean;
  baseUrl: string;
  isYorby: boolean;
  isCoachPortalLandingPage: boolean;
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
  const hostname = useHostname();
  const { logError } = useAxiomLogging();
  const pathname = usePathname();

  const isYorby = useMemo(() => hostname.includes("yorby.ai"), [hostname]);

  const isCoachHomePage = useMemo(() => pathname === "/coaches", [pathname]);

  const isCoachProgramsPage = useMemo(
    () =>
      typeof coachSlug === "string" &&
      pathname === `/coaches/${coachSlug}/programs`,
    [pathname, coachSlug]
  );

  const isCoachPortalLandingPage = useMemo(() => {
    if (typeof coachSlug !== "string") return false;
    return pathname === `/coaches/${coachSlug}`;
  }, [pathname, coachSlug]);

  const isCoachPath = useMemo(
    () => isCoachHomePage || isCoachProgramsPage || isCoachPortalLandingPage,
    [isCoachHomePage, isCoachProgramsPage, isCoachPortalLandingPage]
  );

  useEffect(() => {
    if (isCoachPath) {
      setBaseUrl(`/coaches/${coachSlug}/programs`);
    } else {
      setBaseUrl(`/dashboard/jobs`);
    }
  }, [coachSlug]);

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
      isCoachProgramsPage,
      isCoachHomePage,
      coachBrandingSettings,
      isLoadingBranding,
      baseUrl,
      isYorby,
      isCoachPortalLandingPage,
    }),
    [
      isCoachPath,
      isCoachProgramsPage,
      isCoachHomePage,
      coachBrandingSettings,
      isLoadingBranding,
      baseUrl,
      isYorby,
      isCoachPortalLandingPage,
    ]
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
