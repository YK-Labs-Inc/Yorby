"use server";

import { Button } from "@/components/ui/button";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { useTranslations } from "next-intl";
import { formatDate } from "@/utils/utils";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { startMockInterview } from "./actions";
import CreateMockInterviewButton from "./CreateMockInterviewButton";

interface MockInterviewProps {
  jobId: string;
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

export default async function MockInterview({ jobId }: MockInterviewProps) {
  const t = await getTranslations("mockInterview");
  const mockInterviews = await fetchMockInterviews(jobId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">{t("title")}</h2>
        <CreateMockInterviewButton jobId={jobId} />
      </div>

      {mockInterviews.length === 0 ? (
        <div className="flex items-center justify-center p-8 text-gray-500 bg-gray-50 dark:bg-gray-800/20 rounded-lg">
          {t("noInterviews")}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
            {t("previousInterviews")}
          </h3>
          <div className="grid gap-4">
            {mockInterviews.map((interview) => (
              <Link
                key={interview.id}
                href={`/dashboard/jobs/${jobId}/mockInterviews/${interview.id}`}
                className="flex items-center justify-between p-4 bg-white dark:bg-gray-800/10 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors"
              >
                <div className="flex flex-col">
                  <span className="text-sm text-gray-900 dark:text-gray-200">
                    {t("interviewDate", {
                      date: formatDate(new Date(interview.created_at)),
                    })}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
