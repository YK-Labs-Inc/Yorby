"use server";

import { createSupabaseServerClient } from "@/utils/supabase/server";
import { getTranslations } from "next-intl/server";
import CreateMockInterviewButton from "./CreateMockInterviewButton";
import InterviewFilter from "./InterviewFilter";
import LockedJobComponent from "./LockedJobComponent";
import CreateDemoMockInterviewButton from "./CreateDemoMockInterviewButton";
import MockInterviewOnboarding from "./MockInterviewOnboarding";
import MockInterviewLink from "./MockInterviewLink";

interface MockInterviewProps {
  filter: "all" | "complete" | "in_progress" | null;
  jobId: string;
  userCredits: number;
  isLocked: boolean;
}

async function fetchMockInterviews(jobId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: mockInterviews, error } = await supabase
    .from("custom_job_mock_interviews")
    .select("*")
    .eq("custom_job_id", jobId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return mockInterviews;
}

export default async function MockInterview({
  filter,
  jobId,
  userCredits,
  isLocked,
}: MockInterviewProps) {
  const t = await getTranslations("mockInterview");
  const allMockInterviews = await fetchMockInterviews(jobId);

  const filteredInterviews = allMockInterviews.filter((interview) => {
    if (filter === "complete") return interview.status === "complete";
    if (filter === "in_progress") return interview.status !== "complete";
    return true;
  });

  if (isLocked) {
    return (
      <div className="flex flex-col gap-4 w-full">
        {allMockInterviews.length === 0 && <MockInterviewOnboarding />}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <InterviewFilter jobId={jobId} currentFilter={filter} />
          </div>
          {allMockInterviews.length === 0 && (
            <CreateDemoMockInterviewButton jobId={jobId} />
          )}
        </div>
        {allMockInterviews.length === 0 ? (
          <div className="flex items-center justify-center p-8 text-gray-500 bg-gray-50 dark:bg-gray-800/20 rounded-lg">
            {t("noInterviews")}
          </div>
        ) : (
          <>
            {filteredInterviews.map((interview) => (
              <MockInterviewLink
                key={interview.id}
                interview={interview}
                jobId={jobId}
              />
            ))}
            <LockedJobComponent
              jobId={jobId}
              userCredits={userCredits}
              view="mock"
            />
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {allMockInterviews.length === 0 && <MockInterviewOnboarding />}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <InterviewFilter jobId={jobId} currentFilter={filter} />
        </div>
        <CreateMockInterviewButton jobId={jobId} />
      </div>

      {allMockInterviews.length === 0 ? (
        <div className="flex items-center justify-center p-8 text-gray-500 bg-gray-50 dark:bg-gray-800/20 rounded-lg">
          {t("noInterviews")}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredInterviews.map((interview) => (
            <MockInterviewLink
              key={interview.id}
              interview={interview}
              jobId={jobId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
