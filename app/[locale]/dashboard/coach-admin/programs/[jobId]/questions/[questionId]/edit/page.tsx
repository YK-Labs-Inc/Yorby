import React from "react";
import { redirect } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  ChevronRight,
  Home,
  BookOpen,
  Briefcase,
  MessageSquare,
  Pencil,
} from "lucide-react";
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

// Function to fetch question details
async function getQuestionDetails(questionId: string, jobId: string) {
  const supabase = await createSupabaseServerClient();

  const { data: question, error } = await supabase
    .from("custom_job_questions")
    .select("*")
    .eq("id", questionId)
    .eq("custom_job_id", jobId)
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
  params: Promise<{ jobId: string; questionId: string }>;
}) {
  const { jobId, questionId } = await params;
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

  // Get job details for breadcrumb
  const job = await getJobDetails(jobId, coachId);

  if (!job) {
    // Job not found or doesn't belong to this coach
    return redirect("/dashboard/coach-admin/curriculum");
  }

  // Get question details to populate the form
  const question = await getQuestionDetails(questionId, jobId);

  if (!question) {
    // Question not found or doesn't belong to this job
    return redirect(`/dashboard/coach-admin/curriculum/${jobId}`);
  }

  // Handle form submission
  async function handleUpdateQuestion(formData: FormData) {
    "use server";

    const result = await updateQuestion(jobId, questionId, formData);

    if (result.success) {
      // Redirect to the question detail page
      redirect(
        `/dashboard/coach-admin/curriculum/${jobId}/questions/${questionId}`
      );
    }

    return result;
  }

  return (
    <div className="container mx-auto py-6">
      {/* Breadcrumb navigation */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">
              <Home className="h-4 w-4 mr-1" />
              Dashboard
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRight className="h-4 w-4" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/coach-admin">
              Coach Admin
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRight className="h-4 w-4" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/coach-admin/curriculum">
              <BookOpen className="h-4 w-4 mr-1" />
              Curriculum
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRight className="h-4 w-4" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbLink href={`/dashboard/coach-admin/curriculum/${jobId}`}>
              <Briefcase className="h-4 w-4 mr-1" />
              {job.job_title}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRight className="h-4 w-4" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbLink
              href={`/dashboard/coach-admin/curriculum/${jobId}/questions/${questionId}`}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Question
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRight className="h-4 w-4" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbLink
              href={`/dashboard/coach-admin/curriculum/${jobId}/questions/${questionId}/edit`}
              className="font-semibold"
            >
              <Pencil className="h-4 w-4 mr-1" />
              Edit Question
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Edit Question</h1>
        <p className="text-muted-foreground mt-2">
          Update this interview question for {job.job_title}
        </p>
      </div>

      <QuestionForm
        initialValues={{
          question: question.question,
          answerGuidelines: question.answer_guidelines,
          questionType: question.question_type,
        }}
        onSubmit={handleUpdateQuestion}
        onCancelRedirectUrl={`/dashboard/coach-admin/curriculum/${jobId}/questions/${questionId}`}
        isEditing={true}
      />
    </div>
  );
}
