"use client";

import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";

export const ConditionalSidebarTrigger = () => {
  const pathname = usePathname();
  const isResumeBuilderPage = pathname?.includes("/chat-to-resume");

  if (isResumeBuilderPage) {
    return null;
  }

  return <SidebarTrigger />;
};
