import React from "react";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Home,
  ChevronRight,
  BookOpen,
  Briefcase,
  MessageSquare,
  Plus,
  Pencil,
  Trash2,
  FileText,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { createSampleAnswer, deleteSampleAnswer } from "../../../../actions";
import SampleAnswerForm from "../../../../components/SampleAnswerForm";

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

// Function to fetch sample answers
async function getSampleAnswers(questionId: string) {
  const supabase = await createSupabaseServerClient();

  const { data: sampleAnswers, error } = await supabase
    .from("custom_job_question_sample_answers")
    .select("*")
    .eq("question_id", questionId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching sample answers:", error);
    return [];
  }

  return sampleAnswers || [];
}

export default async function SampleAnswersPage({
  params,
}: {
  params: { jobId: string; questionId: string };
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

  // Get question details
  const question = await getQuestionDetails(params.questionId, params.jobId);

  if (!question) {
    // Question not found or doesn't belong to this job
    return redirect(`/dashboard/coach-admin/curriculum/${params.jobId}`);
  }

  // Get sample answers
  const sampleAnswers = await getSampleAnswers(params.questionId);

  // Handle form submission for creating a sample answer
  async function handleCreateSampleAnswer(formData: FormData) {
    "use server";

    const result = await createSampleAnswer(
      params.jobId,
      params.questionId,
      formData
    );

    if (result.success) {
      // Redirect to refresh the page with the new sample answer
      redirect(
        `/dashboard/coach-admin/curriculum/${params.jobId}/questions/${params.questionId}/sample-answers`
      );
    }

    return result;
  }

  // Handle delete sample answer
  async function handleDeleteSampleAnswer(formData: FormData) {
    "use server";

    const result = await deleteSampleAnswer(
      params.jobId,
      params.questionId,
      formData.get("answerId") as string
    );

    if (result.success) {
      // Redirect to refresh the page without the deleted sample answer
      redirect(
        `/dashboard/coach-admin/curriculum/${params.jobId}/questions/${params.questionId}/sample-answers`
      );
    }
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
              className="font-semibold"
            >
              <FileText className="h-4 w-4 mr-1" />
              Sample Answers
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Back button */}
      <div className="mb-6">
        <Button asChild variant="outline" size="sm">
          <Link href={`/dashboard/coach-admin/curriculum/${params.jobId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Job Profile
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Sample Answers</h1>
        <p className="text-muted-foreground mt-2">
          Manage sample answers for this interview question
        </p>
      </div>

      {/* Question details card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Question</CardTitle>
          <CardDescription>
            The interview question for which you are managing sample answers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">{question.question}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Created on{" "}
                {format(new Date(question.created_at), "MMMM d, yyyy")}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Answer Guidelines</h3>
              <div className="bg-muted p-4 rounded-md whitespace-pre-wrap text-sm">
                {question.answer_guidelines}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for existing answers and adding new ones */}
      <Tabs defaultValue="existing" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="existing">
            Existing Answers ({sampleAnswers.length})
          </TabsTrigger>
          <TabsTrigger value="add">Add New Answer</TabsTrigger>
        </TabsList>

        {/* Existing sample answers tab */}
        <TabsContent value="existing">
          {sampleAnswers.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No Sample Answers Yet</CardTitle>
                <CardDescription>
                  Add sample answers to help students understand what makes a
                  good response to this question.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link
                    href={`/dashboard/coach-admin/curriculum/${params.jobId}/questions/${params.questionId}/sample-answers?tab=add`}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Sample Answer
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {sampleAnswers.map((answer, index) => (
                <Card key={answer.id} id={`answer-${answer.id}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        Sample Answer {index + 1}
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link
                            href={`/dashboard/coach-admin/curriculum/${params.jobId}/questions/${params.questionId}/sample-answers/${answer.id}/edit`}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </Link>
                        </Button>
                        <form action={handleDeleteSampleAnswer}>
                          <input
                            type="hidden"
                            name="answerId"
                            value={answer.id}
                          />
                          <Button size="sm" variant="destructive" type="submit">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </form>
                      </div>
                    </div>
                    <CardDescription>
                      Created on{" "}
                      {format(new Date(answer.created_at), "MMMM d, yyyy")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="whitespace-pre-wrap bg-muted p-4 rounded-md text-sm">
                      {answer.answer}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Add new sample answer tab */}
        <TabsContent value="add">
          <SampleAnswerForm
            onSubmit={handleCreateSampleAnswer}
            onCancelRedirectUrl={`/dashboard/coach-admin/curriculum/${params.jobId}/questions/${params.questionId}/sample-answers`}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
