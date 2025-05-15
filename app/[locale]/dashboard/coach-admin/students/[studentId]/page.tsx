import { H3 } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

const AdminStudentPage = async ({
  params,
}: Readonly<{
  params: Promise<{ studentId: string }>;
}>) => {
  const { studentId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: studentCustomJobs, error: studentCustomJobsError } =
    await supabase.from("custom_jobs").select("*").eq("user_id", studentId);
  if (studentCustomJobsError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <H3>No student found</H3>
        <Link href="/dashboard/coach-admin/students">
          <Button>Go back</Button>
        </Link>
      </div>
    );
  }
  if (studentCustomJobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <H3>No student found</H3>
        <Link href="/dashboard/coach-admin/students">
          <Button>Go back</Button>
        </Link>
      </div>
    );
  }
  redirect(
    `/dashboard/coach-admin/students/${studentId}/jobs/${studentCustomJobs[0].id}`
  );
};

export default AdminStudentPage;
