"use client";

import { useEffect } from "react";
import useSWR from "swr";
import JobSelector from "./JobSelector";
import QuestionsList from "./QuestionsList";
import MockInterviewsList from "./MockInterviewsList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslations } from "next-intl";
import { getStudentPrograms } from "@/app/dashboard/coach-admin/actions";

interface Program {
  id: string;
  job_title: string;
  questionsCount: number;
  mockInterviewsCount: number;
}

interface ProgramSidebarProps {
  studentId: string;
  coachId: string;
  locale: string;
  selectedJob: string | null;
  selectedTab: "questions" | "interviews";
  onJobSelect: (jobId: string) => void;
  onTabChange: (tab: "questions" | "interviews") => void;
  onItemSelect: (itemId: string) => void;
}

export default function ProgramSidebar({
  studentId,
  coachId,
  locale,
  selectedJob,
  selectedTab,
  onJobSelect,
  onTabChange,
  onItemSelect,
}: ProgramSidebarProps) {
  const t = useTranslations("StudentActivitySidebar");
  
  const { data, error, isLoading } = useSWR(
    [`student-programs`, studentId, coachId],
    () => getStudentPrograms(studentId, coachId),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );
  
  const programs = data?.programs || [];
  
  // Auto-select first program if none selected
  useEffect(() => {
    if (!selectedJob && programs.length > 0) {
      onJobSelect(programs[0].id);
    }
  }, [selectedJob, programs, onJobSelect]);
  
  const selectedProgram = programs.find((p) => p.id === selectedJob);
  
  if (isLoading) {
    return (
      <aside className="w-80 border-r flex flex-col bg-gray-50 animate-pulse">
        <div className="p-4 border-b">
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
        <div className="p-4">
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </aside>
    );
  }
  
  if (!isLoading && programs.length === 0) {
    return (
      <aside className="w-80 border-r p-6 bg-gray-50">
        <p className="text-gray-600">{t("noJobsFound")}</p>
      </aside>
    );
  }
  
  return (
    <aside className="w-80 border-r flex flex-col bg-gray-50 h-full overflow-hidden">
      <div className="p-4 border-b bg-white flex-shrink-0">
        <JobSelector
          programs={programs}
          selectedProgram={selectedProgram}
          onSelect={onJobSelect}
        />
      </div>
      
      <Tabs
        value={selectedTab}
        onValueChange={(value) => onTabChange(value as "questions" | "interviews")}
        className="flex-1 flex flex-col min-h-0"
      >
        <TabsList className="grid w-full grid-cols-2 p-1 mx-4 mt-4 flex-shrink-0" style={{ width: "calc(100% - 2rem)" }}>
          <TabsTrigger value="questions">
            {t("questions")} ({selectedProgram?.questionsCount || 0})
          </TabsTrigger>
          <TabsTrigger value="interviews">
            {t("mockInterviews")} ({selectedProgram?.mockInterviewsCount || 0})
          </TabsTrigger>
        </TabsList>
        
        <div className="flex-1 overflow-y-auto min-h-0">
          <TabsContent value="questions" className="h-full mt-0">
            {selectedJob && (
              <QuestionsList
                programId={selectedJob}
                studentId={studentId}
                locale={locale}
                onSelectQuestion={onItemSelect}
              />
            )}
          </TabsContent>
          
          <TabsContent value="interviews" className="h-full mt-0">
            {selectedJob && (
              <MockInterviewsList
                programId={selectedJob}
                studentId={studentId}
                locale={locale}
                onSelectInterview={onItemSelect}
              />
            )}
          </TabsContent>
        </div>
      </Tabs>
    </aside>
  );
}