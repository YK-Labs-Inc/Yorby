"use client";

import { usePathname } from "next/navigation";
import Chatwoot from "./ChatwootWidget";

export default function ChatwootWrapper() {
  const pathname = usePathname();
  const shouldShowChatwoot = !pathname.includes("sample-resumes");

  if (!shouldShowChatwoot) {
    return null;
  }

  return <Chatwoot />;
}
