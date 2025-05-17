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
  FileText,
  Pencil,
} from "lucide-react";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Link } from "@/i18n/routing";
import { updateSampleAnswer } from "@/app/[locale]/dashboard/coach-admin/programs/actions";
import SampleAnswerForm from "@/app/[locale]/dashboard/coach-admin/programs/components/SampleAnswerForm";

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
    .select("question")
    .eq("id", questionId)
    .eq("custom_job_id", jobId)
    .single();

  if (error || !question) {
    console.error("Error fetching question details:", error);
    return null;
  }

  return question;
}

// Function to fetch sample answer details
async function getSampleAnswerDetails(answerId: string, questionId: string) {
  const supabase = await createSupabaseServerClient();

  const { data: sampleAnswer, error } = await supabase
    .from("custom_job_question_sample_answers")
    .select("*")
    .eq("id", answerId)
    .eq("question_id", questionId)
    .single();

  if (error || !sampleAnswer) {
    console.error("Error fetching sample answer details:", error);
    return null;
  }

  return sampleAnswer;
}

export default async function EditSampleAnswerPage({
  params,
}: {
  params: { jobId: string; questionId: string; answerId: string };
}) {
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
  const job = await getJobDetails(params.jobId, coachId);

  if (!job) {
    // Job not found or doesn't belong to this coach
    return redirect("/dashboard/coach-admin/curriculum");
  }

  // Get question details for breadcrumb
  const question = await getQuestionDetails(params.questionId, params.jobId);

  if (!question) {
    // Question not found or doesn't belong to this job
    return redirect(`/dashboard/coach-admin/curriculum/${params.jobId}`);
  }

  // Get sample answer details to populate the form
  const sampleAnswer = await getSampleAnswerDetails(
    params.answerId,
    params.questionId
  );

  if (!sampleAnswer) {
    // Sample answer not found or doesn't belong to this question
    return redirect(
      `/dashboard/coach-admin/curriculum/${params.jobId}/questions/${params.questionId}/sample-answers`
    );
  }

  // Handle form submission
  async function handleUpdateSampleAnswer(formData: FormData) {
    "use server";

    const result = await updateSampleAnswer(
      params.jobId,
      params.questionId,
      params.answerId,
      formData
    );

    if (result.success) {
      // Redirect to the sample answers management page
      redirect(
        `/dashboard/coach-admin/curriculum/${params.jobId}/questions/${params.questionId}/sample-answers`
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
            <BreadcrumbLink
              href={`/dashboard/coach-admin/curriculum/${params.jobId}`}
            >
              <Briefcase className="h-4 w-4 mr-1" />
              {job.job_title}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRight className="h-4 w-4" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbLink
              href={`/dashboard/coach-admin/curriculum/${params.jobId}/questions/${params.questionId}`}
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
              href={`/dashboard/coach-admin/curriculum/${params.jobId}/questions/${params.questionId}/sample-answers`}
            >
              <FileText className="h-4 w-4 mr-1" />
              Sample Answers
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRight className="h-4 w-4" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbLink
              href={`/dashboard/coach-admin/curriculum/${params.jobId}/questions/${params.questionId}/sample-answers/${params.answerId}/edit`}
              className="font-semibold"
            >
              <Link
                href={`/dashboard/coach-admin/curriculum/${params.jobId}/questions/${params.questionId}/sample-answers/${params.answerId}/edit`}
              >
                <Pencil className="h-4 w-4 mr-1" />
                Edit Sample Answer
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Edit Sample Answer
        </h1>
        <p className="text-muted-foreground mt-2">
          Update this sample answer for the question: "
          {question.question.length > 100
            ? `${question.question.substring(0, 100)}...`
            : question.question}
          "
        </p>
      </div>

      <SampleAnswerForm
        initialValues={{
          answer: sampleAnswer.answer,
        }}
        onSubmit={handleUpdateSampleAnswer}
        onCancelRedirectUrl={`/dashboard/coach-admin/curriculum/${params.jobId}/questions/${params.questionId}/sample-answers`}
        isEditing={true}
      />
    </div>
  );
}
