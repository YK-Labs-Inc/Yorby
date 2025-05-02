import { createSupabaseServerClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import UploadQuestionsClient from "./UploadQuestionsClient";
import { Logger } from "next-axiom";

const fetchJob = async (jobId: string) => {
  const logger = new Logger().with({ jobId });
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("custom_jobs")
    .select("*")
    .eq("id", jobId)
    .single();
  if (error) {
    logger.error("Error fetching job", { error });
    await logger.flush();
    return null;
  }
  return data;
};

export default async function UploadQuestionsPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }
  const jobId = (await params).jobId;

  const job = await fetchJob(jobId);
  if (!job) {
    redirect("/dashboard");
  }
  return <UploadQuestionsClient jobId={jobId} job={job} />;
}
