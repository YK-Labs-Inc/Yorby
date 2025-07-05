import React from "react";
import { redirect } from "next/navigation";
import ProgramForm from "../components/ProgramForm";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { getCoachId } from "../../actions";

export default async function NewJobPage() {
  const supabase = await createSupabaseServerClient();

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Verify the user is a coach
  const coachId = await getCoachId(user.id);

  if (!coachId) {
    // User is not a coach, redirect to dashboard
    return redirect("/dashboard");
  }

  return (
    <div className="container mx-auto py-6">
      <ProgramForm onCancelRedirectUrl={"/dashboard/coach-admin/programs"} />
    </div>
  );
}
