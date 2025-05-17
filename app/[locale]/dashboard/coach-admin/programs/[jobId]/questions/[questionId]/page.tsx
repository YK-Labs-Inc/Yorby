import React from "react";
import Link from "next/link";
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
import { Badge } from "@/components/ui/badge";
import {
  Home,
  ChevronRight,
  BookOpen,
  Briefcase,
  MessageSquare,
  Pencil,
  Trash2,
  FileText,
  ArrowLeft,
  Plus,
} from "lucide-react";
import { Database } from "@/utils/supabase/database.types";
import { createSupabaseServerClient } from "@/utils/supabase/server";

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

export default async function QuestionDetailPage({
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
              className="font-semibold"
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Question Details
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

      {/* Header with action buttons */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Question Details
          </h1>
          <p className="text-muted-foreground mt-1">
            View and manage this interview question
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link
              href={`/dashboard/coach-admin/curriculum/${params.jobId}/questions/${params.questionId}/edit`}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit Question
            </Link>
          </Button>
          <Button asChild variant="destructive">
            <Link
              href={`/dashboard/coach-admin/curriculum/${params.jobId}/questions/${params.questionId}/delete`}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Question
            </Link>
          </Button>
        </div>
      </div>

      {/* Question details card */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Question Information</CardTitle>
              <CardDescription>
                Details about this interview question
              </CardDescription>
            </div>
            <Badge variant="outline">
              {question.question_type === "ai_generated"
                ? "AI Generated"
                : "Manual"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-2">Question</h3>
              <div className="bg-muted p-4 rounded-md whitespace-pre-wrap">
                {question.question}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Answer Guidelines</h3>
              <div className="bg-muted p-4 rounded-md whitespace-pre-wrap">
                {question.answer_guidelines}
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              Created on {format(new Date(question.created_at), "MMMM d, yyyy")}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sample answers section */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">
          Sample Answers
        </h2>
        <Button asChild>
          <Link
            href={`/dashboard/coach-admin/curriculum/${params.jobId}/questions/${params.questionId}/sample-answers`}
          >
            <FileText className="h-4 w-4 mr-2" />
            Manage Sample Answers
          </Link>
        </Button>
      </div>

      {/* Empty sample answers state */}
      {sampleAnswers.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>No Sample Answers Yet</CardTitle>
            <CardDescription>
              Add sample answers to help students understand what makes a good
              response to this question.
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
      )}

      {/* Sample answers list */}
      {sampleAnswers.length > 0 && (
        <div className="space-y-6">
          {sampleAnswers.map((answer, index) => (
            <Card key={answer.id} id={`answer-${answer.id}`}>
              <CardHeader>
                <CardTitle className="text-base">
                  Sample Answer {index + 1}
                </CardTitle>
                <CardDescription>
                  Created on{" "}
                  {format(new Date(answer.created_at), "MMMM d, yyyy")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap bg-muted p-4 rounded-md">
                  {answer.answer}
                </div>
              </CardContent>
            </Card>
          ))}

          {sampleAnswers.length > 0 && (
            <div className="flex justify-center mt-4">
              <Button asChild variant="outline">
                <Link
                  href={`/dashboard/coach-admin/curriculum/${params.jobId}/questions/${params.questionId}/sample-answers`}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View All Sample Answers
                </Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
