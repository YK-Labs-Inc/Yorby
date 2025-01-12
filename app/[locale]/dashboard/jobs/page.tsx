import JobCreationComponent from "@/app/[locale]/JobCreationComponent";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

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
export default async function JobsPage() {
  const jobs = await fetchJobs();
  if (jobs.length > 0) {
    redirect(`/dashboard/jobs/${jobs[0].id}`);
  }
  return (
    <div className="w-full flex justify-center items-center">
      <JobCreationComponent />
    </div>
  );
}
