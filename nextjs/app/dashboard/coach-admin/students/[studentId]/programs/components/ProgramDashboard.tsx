"use client";

import useSWR from "swr";
import ProgramSidebar from "./Sidebar/ProgramSidebar";
import QuestionView from "./Content/QuestionView";
import MockInterviewView from "./Content/MockInterviewView";
import EmptyState from "./Content/EmptyState";
import { getCurrentUserCoachId } from "@/app/dashboard/coach-admin/actions";

interface ProgramDashboardProps {
  studentId: string;
  locale: string;
  selectedJob: string | null;
  selectedTab: "questions" | "interviews";
  selectedItem: string | null;
  onJobSelect: (jobId: string) => void;
  onTabChange: (tab: "questions" | "interviews") => void;
  onItemSelect: (itemId: string) => void;
}

export default function ProgramDashboard({
  studentId,
  locale,
  selectedJob,
  selectedTab,
  selectedItem,
  onJobSelect,
  onTabChange,
  onItemSelect,
}: ProgramDashboardProps) {
  const {
    data: coachId,
    error,
    isLoading,
  } = useSWR("current-user-coach-id", getCurrentUserCoachId, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  if (isLoading || !coachId) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex w-full h-full overflow-hidden">
      <ProgramSidebar
        studentId={studentId}
        coachId={coachId}
        locale={locale}
        selectedJob={selectedJob}
        selectedTab={selectedTab}
        onJobSelect={onJobSelect}
        onTabChange={onTabChange}
        onItemSelect={onItemSelect}
      />

      <div className="flex-1 overflow-y-auto">
        {selectedItem ? (
          selectedTab === "questions" ? (
            <QuestionView questionId={selectedItem} studentId={studentId} />
          ) : (
            <MockInterviewView interviewId={selectedItem} locale={locale} />
          )
        ) : (
          <EmptyState tab={selectedTab} locale={locale} />
        )}
      </div>
    </div>
  );
}
