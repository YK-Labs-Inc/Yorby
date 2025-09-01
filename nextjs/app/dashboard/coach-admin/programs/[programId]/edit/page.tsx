import React from "react";
import { redirect } from "next/navigation";
import JobForm from "../../components/ProgramForm";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { getTranslations } from "next-intl/server";
import { getServerUser } from "@/utils/auth/server";

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
async function getJobDetails(programId: string, coachId: string) {
  const supabase = await createSupabaseServerClient();

  const { data: job, error } = await supabase
    .from("custom_jobs")
    .select("*")
    .eq("id", programId)
    .eq("coach_id", coachId)
    .single();

  if (error || !job) {
    console.error("Error fetching job details:", error);
    return null;
  }

  return job;
}

export default async function EditJobPage({
  params,
}: {
  params: Promise<{ programId: string }>;
}) {
  const { programId } = await params;

  // Get the current user
  const user = await getServerUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Verify the user is a coach
  const coachId = await getCoachId(user.id);

  if (!coachId) {
    // User is not a coach, redirect to dashboard
    return redirect("/onboarding");
  }

  // Get job details to populate the form
  const job = await getJobDetails(programId, coachId);

  if (!job) {
    // Job not found or doesn't belong to this coach
    return redirect("/dashboard/coach-admin/programs");
  }

  const t = await getTranslations(
    "coachAdminPortal.programsPage.programEditPage"
  );

  return (
    <div className="container mx-auto py-6">
      <JobForm
        initialValues={{
          title: job.job_title,
          description: job.job_description || "",
        }}
        onCancelRedirectUrl={`/dashboard/coach-admin/programs/${programId}`}
        isEditing={true}
        programId={programId}
      />
    </div>
  );
}
