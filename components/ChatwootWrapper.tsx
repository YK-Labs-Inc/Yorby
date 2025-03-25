"use client";

import { usePathname } from "next/navigation";
import Chatwoot from "./ChatwootWidget";
import { useEffect, useState } from "react";

export default function ChatwootWrapper() {
  const pathname = usePathname();
  const [shouldShowChatwoot, setShouldShowChatwoot] = useState(false);

  useEffect(() => {
    setShouldShowChatwoot(
      !pathname.includes("sample-resumes") &&
        !pathname.includes("mockInterviews") &&
        !pathname.includes("mock-interviews")
    );
  }, [pathname]);

  if (!shouldShowChatwoot) {
    return null;
  }

  return <Chatwoot />;
}
