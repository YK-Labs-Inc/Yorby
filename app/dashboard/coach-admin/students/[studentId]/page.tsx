import { createSupabaseServerClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

const AdminStudentPage = async ({
  params,
}: Readonly<{
  params: Promise<{ studentId: string }>;
}>) => {
  const { studentId } = await params;
  const supabase = await createSupabaseServerClient();

  // Get the current coach's ID
  const {
    data: { user: coachUser },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !coachUser) {
    redirect("/sign-in");
  }

  const { data: coach, error: coachError } = await supabase
    .from("coaches")
    .select("id")
    .eq("user_id", coachUser.id)
    .single();

  if (coachError || !coach) {
    redirect("/onboarding");
  }

  // Redirect to the new programs page
  redirect(`/dashboard/coach-admin/students/${studentId}/programs`);
};

export default AdminStudentPage;
