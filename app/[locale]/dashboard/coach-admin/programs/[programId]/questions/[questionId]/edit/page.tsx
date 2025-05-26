import React from "react";
import { redirect } from "next/navigation";
import { Home, BookOpen, Briefcase, MessageSquare, Pencil } from "lucide-react";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { updateQuestion } from "../../../../actions";
import QuestionForm from "../../../../components/QuestionForm";

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
    .select("job_title")
    .eq("id", programId)
    .eq("coach_id", coachId)
    .single();

  if (error || !job) {
    console.error("Error fetching job details:", error);
    return null;
  }

  return job;
}

// Function to fetch question details
async function getQuestionDetails(questionId: string, programId: string) {
  const supabase = await createSupabaseServerClient();

  const { data: question, error } = await supabase
    .from("custom_job_questions")
    .select("*")
    .eq("id", questionId)
    .eq("custom_job_id", programId)
    .single();

  if (error || !question) {
    console.error("Error fetching question details:", error);
    return null;
  }

  return question;
}

export default async function EditQuestionPage({
  params,
}: {
  params: Promise<{ programId: string; questionId: string }>;
}) {
  const { programId, questionId } = await params;
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
  const job = await getJobDetails(programId, coachId);

  if (!job) {
    // Job not found or doesn't belong to this coach
    return redirect("/dashboard/coach-admin/programs");
  }

  // Get question details to populate the form
  const question = await getQuestionDetails(questionId, programId);

  if (!question) {
    // Question not found or doesn't belong to this job
    return redirect(`/dashboard/coach-admin/programs/${programId}`);
  }

  return (
    <div className="container mx-auto py-6">
      <QuestionForm
        initialValues={{
          question: question.question,
          answerGuidelines: question.answer_guidelines,
          questionType: question.question_type,
          publication_status: question.publication_status,
        }}
        programId={programId}
        onCancelRedirectUrl={`/dashboard/coach-admin/programs/${programId}/questions/${questionId}`}
        isEditing={true}
        questionId={questionId}
      />
    </div>
  );
}
