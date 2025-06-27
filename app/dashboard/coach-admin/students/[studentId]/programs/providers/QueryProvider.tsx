"use client";

import { SWRConfig } from "swr";
import { ReactNode } from "react";

export default function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        refreshInterval: 0, // Disable auto refresh
        revalidateOnFocus: false, // Don't revalidate on window focus
        revalidateOnReconnect: false, // Don't revalidate on reconnect
        dedupingInterval: 5 * 60 * 1000, // 5 minutes deduping
      }}
    >
      {children}
    </SWRConfig>
  );
}