"use client";

import { createContext, useContext, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { setReferralCode } from "./actions";

interface ReferralContextType {
  hasReferralCode: boolean;
}

const ReferralContext = createContext<ReferralContextType>({
  hasReferralCode: false,
});

export function ReferralProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!searchParams) return;

    // Check if there's a referral code in the URL
    const refParam = searchParams.get("ref");

    if (refParam) {
      // If there's a referral code in the URL, store it in a cookie using the server action
      setReferralCode(refParam);
    }
  }, [searchParams]);

  return (
    <ReferralContext.Provider
      value={{
        hasReferralCode: !!searchParams?.get("ref"),
      }}
    >
      {children}
    </ReferralContext.Provider>
  );
}

export function useReferral() {
  const context = useContext(ReferralContext);
  if (context === undefined) {
    throw new Error("useReferral must be used within a ReferralProvider");
  }
  return context;
}
