import { H1 } from "@/components/typography";
import { Link } from "@/i18n/routing";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PracticeQuestions from "./PracticeQuestions";
import MockInterview from "./MockInterview";

const fetchJob = async (jobId: string) => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("custom_jobs")
    .select(
      `*, 
      custom_job_questions(*, 
        custom_job_question_submissions(*))`
    )
    .eq("id", jobId)
    .single();
  if (error) {
    throw error;
  }
  return {
    ...data,
    custom_job_questions: data.custom_job_questions.sort(
      (a: any, b: any) => a.created_at - b.created_at
    ),
  };
};

export default async function JobPage({
  params,
  searchParams,
}: {
  params: Promise<{ jobId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const jobId = (await params).jobId;
  const job = await fetchJob(jobId);
  const view = ((await searchParams)?.view as string) || "practice";

  return (
    <div className="w-full flex flex-col my-8 mx-4 gap-6">
      <H1>
        {job.job_title
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")}{" "}
        Practice Interview Questions{" "}
      </H1>

      <Tabs value={view} className="w-full">
        <TabsList>
          <Link href={`?view=practice`} className="w-full">
            <TabsTrigger value="practice" className="w-full">
              Practice Questions
            </TabsTrigger>
          </Link>
          <Link href={`?view=mock`} className="w-full">
            <TabsTrigger value="mock" className="w-full">
              Mock Interview
            </TabsTrigger>
          </Link>
        </TabsList>
      </Tabs>

      {view === "practice" && (
        <PracticeQuestions jobId={jobId} questions={job.custom_job_questions} />
      )}

      {view === "mock" && <MockInterview jobId={jobId} />}
    </div>
  );
}
