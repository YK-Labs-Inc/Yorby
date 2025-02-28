import JobCreationComponent from "@/app/[locale]/JobCreationComponent";
import { Tables } from "@/utils/supabase/database.types";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export const maxDuration = 300;

const fetchJobs = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/sign-in");
  }
  const { data, error } = await supabase
    .from("custom_jobs")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) {
    throw error;
  }
  return data;
};

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const errorMessage = (await searchParams).error as string;
  const newJob = (await searchParams).newJob === "true";
  let jobs: Tables<"custom_jobs">[] = [];
  if (!newJob) {
    jobs = await fetchJobs();
  }
  if (jobs.length > 0) {
    redirect(`/dashboard/jobs/${jobs[0].id}?error=${errorMessage}`);
  }
  const showOnboarding = jobs.length === 0;
  return (
    <div className="w-full flex justify-center items-center p-8">
      <JobCreationComponent showOnboarding={showOnboarding} />
    </div>
  );
}
