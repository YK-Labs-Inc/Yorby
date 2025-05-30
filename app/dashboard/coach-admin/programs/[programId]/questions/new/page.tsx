import React from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import QuestionForm from "../../../components/QuestionForm";
import { Logger } from "next-axiom";

// Helper function to get coach ID from user ID
async function getCoachId(userId: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("coaches")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    console.error("Error fetching coach ID:", error);
    return null;
  }

  return data.id;
}

// Function to fetch job details
async function getProgramDetails(programId: string, coachId: string) {
  const supabase = await createSupabaseServerClient();
  const logger = new Logger().with({ programId, coachId });

  const { data: job, error } = await supabase
    .from("custom_jobs")
    .select("job_title")
    .eq("id", programId)
    .eq("coach_id", coachId)
    .single();

  if (error || !job) {
    logger.error("Error fetching job details:", { error });
    await logger.flush();
    return null;
  }

  return job;
}

export default async function NewQuestionPage({
  params,
}: {
  params: Promise<{ programId: string }>;
}) {
  const { programId } = await params;
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
    return redirect("/onboarding");
  }

  // Get job details
  const job = await getProgramDetails(programId, coachId);

  if (!job) {
    // Job not found or doesn't belong to this coach
    return redirect("/dashboard/coach-admin/programs");
  }

  return (
    <div className="container mx-auto py-6">
      <QuestionForm
        programId={programId}
        onCancelRedirectUrl={`/dashboard/coach-admin/programs/${programId}`}
      />
    </div>
  );
}
