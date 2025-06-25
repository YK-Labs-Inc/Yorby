"use client";

import { useRouter, usePathname } from "next/navigation";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { EnrolledJob } from "@/utils/supabase/queries/studentActivity";

interface JobSelectorProps {
  jobs: EnrolledJob[];
  selectedJob: EnrolledJob;
  studentId: string;
  locale: string;
}

export default function JobSelector({
  jobs,
  selectedJob,
  studentId,
  locale,
}: JobSelectorProps) {
  const t = useTranslations("StudentActivitySidebar");
  const router = useRouter();
  const pathname = usePathname();
  const isMockInterview = pathname?.includes("mockInterviews");

  const handleJobChange = (newJobId: string) => {
    const targetBase = `/dashboard/coach-admin/students/${studentId}/jobs/${newJobId}`;
    // Navigate to the new job's first question or mock interview
    if (isMockInterview) {
      router.push(`${targetBase}/mockInterviews/placeholder`);
    } else {
      router.push(`${targetBase}/questions/placeholder`);
    }
  };

  const getDescription = () => {
    if (isMockInterview) {
      return t("mockInterviewCount", {
        count: selectedJob.mockInterviewsCount || 0,
      });
    }
    return t("questionsCount", { count: selectedJob.questionsCount || 0 });
  };

  if (jobs.length <= 1) {
    return (
      <Card className="w-full bg-white border rounded-lg shadow-sm">
        <div className="px-4 py-3">
          <CardTitle className="text-base font-semibold text-gray-800 truncate">
            {selectedJob.job_title}
          </CardTitle>
          <CardDescription className="text-xs text-gray-500">
            {getDescription()}
          </CardDescription>
        </div>
      </Card>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 flex items-center justify-between shadow-sm hover:bg-gray-50 transition text-left"
        >
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-800 truncate">
              {selectedJob.job_title}
            </span>
            <span className="text-xs text-gray-500">{getDescription()}</span>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-[calc(theme(space.80)-theme(space.8))] mt-1 bg-white shadow-lg rounded-md border"
      >
        {jobs.map((job) => (
          <DropdownMenuItem
            key={job.id}
            onSelect={() => handleJobChange(job.id)}
            className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
          >
            <div className="flex flex-col items-start">
              <span className="font-medium text-gray-800">
                {job.job_title}
              </span>
              <span className="text-xs text-gray-500">
                {t("questions")}: {job.questionsCount || 0},{" "}
                {t("mockInterviews")}: {job.mockInterviewsCount || 0}
              </span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}