import React from "react";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertTriangle,
  Home,
  BookOpen,
  Briefcase,
  Trash2,
  ArrowLeft,
  MessageSquare,
  Pencil,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { deleteQuestion } from "../../../../actions";
import { Link } from "@/i18n/routing";

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

// Function to fetch question details and count sample answers
async function getQuestionDetails(questionId: string, jobId: string) {
  const supabase = await createSupabaseServerClient();

  // Fetch question details
  const { data: question, error: questionError } = await supabase
    .from("custom_job_questions")
    .select("*")
    .eq("id", questionId)
    .eq("custom_job_id", jobId)
    .single();

  if (questionError || !question) {
    console.error("Error fetching question details:", questionError);
    return null;
  }

  // Count sample answers for this question
  const { count: sampleAnswerCount, error: countError } = await supabase
    .from("custom_job_question_sample_answers")
    .select("*", { count: "exact", head: true })
    .eq("question_id", questionId);

  if (countError) {
    console.error("Error counting sample answers:", countError);
    return { ...question, sampleAnswerCount: 0 };
  }

  return { ...question, sampleAnswerCount: sampleAnswerCount || 0 };
}

export default async function DeleteQuestionPage({
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

  // Get job details
  const job = await getJobDetails(jobId, coachId);

  if (!job) {
    // Job not found or doesn't belong to this coach
    return redirect("/dashboard/coach-admin/curriculum");
  }

  // Get question details
  const question = await getQuestionDetails(questionId, jobId);

  if (!question) {
    // Question not found or doesn't belong to this job
    return redirect(`/dashboard/coach-admin/curriculum/${jobId}`);
  }

  // Handle question deletion
  async function handleDeleteQuestion() {
    "use server";

    const result = await deleteQuestion(jobId, questionId);

    if (result.success) {
      // Redirect to the job detail page
      redirect(`/dashboard/coach-admin/curriculum/${jobId}`);
    }
  }

  return (
    <div className="container mx-auto py-6">
      {/* Back button */}
      <div className="mb-6">
        <Button asChild variant="outline" size="sm">
          <Link
            href={`/dashboard/coach-admin/curriculum/${jobId}/questions/${questionId}`}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Question
          </Link>
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Delete Interview Question
        </h1>
        <p className="text-muted-foreground mt-2">
          Confirm deletion of this interview question from your curriculum
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-destructive flex items-center">
            <Trash2 className="h-5 w-5 mr-2" />
            Confirm Deletion
          </CardTitle>
          <CardDescription>
            You are about to delete the following interview question from your
            curriculum
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium">Question:</h3>
            <p className="text-lg mt-1">{question.question}</p>
          </div>

          <div>
            <h3 className="font-medium">Answer Guidelines:</h3>
            <div className="bg-muted p-4 rounded-md whitespace-pre-wrap text-sm mt-1">
              {question.answer_guidelines}
            </div>
          </div>

          <div>
            <h3 className="font-medium">Associated Sample Answers:</h3>
            <p>
              {question.sampleAnswerCount} sample answer
              {question.sampleAnswerCount !== 1 ? "s" : ""}
            </p>
          </div>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              This action cannot be undone. Deleting this question will also
              delete all associated sample answers. Students will no longer be
              able to practice with this question.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild>
            <Link
              href={`/dashboard/coach-admin/curriculum/${jobId}/questions/${questionId}`}
            >
              Cancel
            </Link>
          </Button>
          <form action={handleDeleteQuestion}>
            <Button type="submit" variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Question
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
