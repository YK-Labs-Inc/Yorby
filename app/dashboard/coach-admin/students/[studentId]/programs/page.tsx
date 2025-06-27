"use client";

import { useState, useCallback } from "react";
import {
  useSearchParams,
  useRouter,
  usePathname,
  useParams,
} from "next/navigation";
import ProgramDashboard from "./components/ProgramDashboard";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function ProgramsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  // Get params directly from useParams hook
  const studentId = params.studentId as string;
  const locale = params.locale as string;

  // Initialize state from URL parameters
  const [selectedJob, setSelectedJob] = useState<string | null>(
    searchParams.get("job")
  );
  const [selectedTab, setSelectedTab] = useState<"questions" | "interviews">(
    (searchParams.get("tab") as "questions" | "interviews") || "questions"
  );
  const [selectedItem, setSelectedItem] = useState<string | null>(
    searchParams.get("item")
  );

  // Update URL when state changes
  const updateURL = useCallback(
    (updates: Record<string, string | null>) => {
      const current = new URLSearchParams(searchParams);

      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          current.set(key, value);
        } else {
          current.delete(key);
        }
      });

      const newURL = `${pathname}?${current.toString()}`;
      router.push(newURL, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  // Handle job selection
  const handleJobSelect = useCallback(
    (jobId: string) => {
      setSelectedJob(jobId);
      setSelectedItem(null); // Clear selected item when changing jobs
      updateURL({ job: jobId, item: null });
    },
    [updateURL]
  );

  // Handle tab change
  const handleTabChange = useCallback(
    (tab: "questions" | "interviews") => {
      setSelectedTab(tab);
      setSelectedItem(null); // Clear selected item when changing tabs
      updateURL({ tab, item: null });
    },
    [updateURL]
  );

  // Handle item selection
  const handleItemSelect = useCallback(
    (itemId: string) => {
      setSelectedItem(itemId);
      updateURL({ item: itemId });
    },
    [updateURL]
  );

  return (
    <ProgramDashboard
      studentId={studentId}
      locale={locale}
      selectedJob={selectedJob}
      selectedTab={selectedTab}
      selectedItem={selectedItem}
      onJobSelect={handleJobSelect}
      onTabChange={handleTabChange}
      onItemSelect={handleItemSelect}
    />
  );
}
