import { redirect } from "next/navigation";
import StudentProgramsDashboard from "./StudentProgramsDashboard";
import { createSupabaseServerClient } from "@/utils/supabase/server";

export default async function StudentProgramsPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return <StudentProgramsDashboard userId={user.id} />;
}
