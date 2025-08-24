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
  isYorbyCoaching: boolean;
  isCoachPortalLandingPage: boolean;
  isCoachDashboardPage: boolean;
  isYorbyRecruiting: boolean;
  isRecruitingAuthPage: boolean;
  isPerfectInterview: boolean;
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

  const isYorbyCoaching = useMemo(
    () =>
      hostname.includes("app.yorby.ai") ||
      process.env.NEXT_PUBLIC_IS_YORBY === "true",
    [hostname]
  );

  const isYorbyRecruiting = useMemo(
    () => pathname.startsWith("/recruiting"),
    [pathname]
  );

  const isRecruitingAuthPage = useMemo(
    () => (isYorbyRecruiting && pathname?.startsWith(`/auth`)) ?? false,
    [pathname, isYorbyRecruiting]
  );

  const isPerfectInterview = useMemo(
    () => pathname.includes("/dashboard"),
    [pathname]
  );

  const isCoachHomePage = useMemo(
    () => pathname === "/coaches" || (isYorbyCoaching && pathname === "/"),
    [pathname, isYorbyCoaching]
  );

  const isCoachProgramsPage = useMemo(
    () =>
      (typeof coachSlug === "string" &&
        pathname?.startsWith(`/${coachSlug}/programs`)) ??
      false,
    [pathname, coachSlug]
  );

  const isCoachDashboardPage = useMemo(
    () => pathname?.startsWith(`/dashboard/coach-admin`) ?? false,
    [pathname, coachSlug]
  );

  const isCoachPortalLandingPage = useMemo(() => {
    if (typeof coachSlug !== "string") return false;
    return pathname === `/${coachSlug}`;
  }, [pathname, coachSlug]);

  const isCoachPath = useMemo(
    () =>
      isCoachHomePage ||
      isCoachProgramsPage ||
      isCoachPortalLandingPage ||
      isCoachDashboardPage,
    [
      isCoachHomePage,
      isCoachProgramsPage,
      isCoachPortalLandingPage,
      isCoachDashboardPage,
    ]
  );

  useEffect(() => {
    if (isCoachPath && coachSlug) {
      setBaseUrl(`/${coachSlug}/programs`);
    } else if (isCoachDashboardPage) {
      setBaseUrl(`/dashboard/coach-admin/programs`);
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
      isYorbyCoaching,
      isCoachPortalLandingPage,
      isCoachDashboardPage,
      isYorbyRecruiting,
      isRecruitingAuthPage,
      isPerfectInterview,
    }),
    [
      isCoachPath,
      isCoachProgramsPage,
      isCoachHomePage,
      coachBrandingSettings,
      isLoadingBranding,
      baseUrl,
      isYorbyCoaching,
      isCoachPortalLandingPage,
      isCoachDashboardPage,
      isYorbyRecruiting,
      isRecruitingAuthPage,
      isPerfectInterview,
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
