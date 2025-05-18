import React from "react";
import { redirect } from "next/navigation";
import { Home, BookOpen, Briefcase, Plus } from "lucide-react";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import QuestionForm from "../../../components/QuestionForm";
import { createQuestion } from "../../../actions";

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
async function getJobDetails(jobId: string, coachId: string) {
  const supabase = await createSupabaseServerClient();

  const { data: job, error } = await supabase
    .from("custom_jobs")
    .select("job_title")
    .eq("id", jobId)
    .eq("coach_id", coachId)
    .single();

  if (error || !job) {
    console.error("Error fetching job details:", error);
    return null;
  }

  return job;
}

export default async function NewQuestionPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
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

  // Get job details
  const job = await getJobDetails(jobId, coachId);

  if (!job) {
    // Job not found or doesn't belong to this coach
    return redirect("/dashboard/coach-admin/curriculum");
  }

  // Handle form submission
  async function handleCreateQuestion(formData: FormData) {
    "use server";

    const result = await createQuestion(jobId, formData);

    if (result.success) {
      // Redirect to the job detail page
      redirect(`/dashboard/coach-admin/curriculum/${jobId}`);
    }

    return result;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Add New Question</h1>
        <p className="text-muted-foreground mt-2">
          Create a new interview question for {job.job_title}
        </p>
      </div>
      <QuestionForm
        onSubmit={handleCreateQuestion}
        onCancelRedirectUrl={`/dashboard/coach-admin/curriculum/${jobId}`}
      />
    </div>
  );
}
