import { H1 } from "@/components/typography";
import { Link } from "@/i18n/routing";
import { createSupabaseServerClient } from "@/utils/supabase/server";

const fetchJob = async (jobId: string) => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("custom_jobs")
    .select("*, custom_job_questions(*)")
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
}: {
  params: Promise<{ jobId: string }>;
}) {
  const jobId = (await params).jobId;
  const job = await fetchJob(jobId);

  return (
    <div className="w-full flex flex-col my-8 mx-4 gap-6">
      <H1>
        {job.job_title
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")}{" "}
        Practice Interview Questions{" "}
      </H1>

      <div className="flex flex-col gap-4">
        {job.custom_job_questions.map((question: any, index: number) => (
          <Link
            key={question.id}
            href={`/dashboard/jobs/${jobId}/${question.id}`}
            className={`rounded p-4 transition-colors flex items-center gap-3
              ${
                index % 2 === 0
                  ? "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800/20 dark:hover:bg-gray-800/30"
                  : "bg-white hover:bg-gray-100 dark:bg-gray-800/10 dark:hover:bg-gray-800/20"
              }`}
            rel="noopener noreferrer"
            target="_blank"
          >
            <span className="text-gray-500 dark:text-gray-400 text-xs font-mono">
              {(index + 1).toString().padStart(2, "0")}
            </span>
            <span className="font-medium text-gray-900 dark:text-gray-200">
              {question.question}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
