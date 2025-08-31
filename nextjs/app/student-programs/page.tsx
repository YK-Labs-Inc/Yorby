import { redirect } from "next/navigation";
import StudentProgramsDashboard from "./StudentProgramsDashboard";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { getServerUser } from "@/utils/auth/server";

export default async function StudentProgramsPage() {
  const user = await getServerUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return <StudentProgramsDashboard userId={user.id} />;
}
