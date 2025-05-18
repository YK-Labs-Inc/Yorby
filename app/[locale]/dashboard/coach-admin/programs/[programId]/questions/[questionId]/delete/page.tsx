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
import { AlertTriangle, Trash2, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Link } from "@/i18n/routing";
import { deleteQuestion } from "./actions";
import { getTranslations } from "next-intl/server";

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

// Function to fetch question details and count sample answers
async function getQuestionDetails(questionId: string, programId: string) {
  const supabase = await createSupabaseServerClient();

  // Fetch question details
  const { data: question, error: questionError } = await supabase
    .from("custom_job_questions")
    .select("*")
    .eq("id", questionId)
    .eq("custom_job_id", programId)
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

  // Get question details
  const question = await getQuestionDetails(questionId, programId);

  if (!question) {
    // Question not found or doesn't belong to this job
    return redirect(`/dashboard/coach-admin/programs/${programId}`);
  }
  const t = await getTranslations(
    "coachAdminPortal.questionsPage.deleteQuestions"
  );

  return (
    <div className="container mx-auto py-6">
      {/* Back button */}
      <div className="mb-6">
        <Button asChild variant="outline" size="sm">
          <Link
            href={`/dashboard/coach-admin/programs/${programId}/questions/${questionId}`}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("backToAllQuestions")}
          </Link>
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          {t("deleteQuestion")}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-destructive flex items-center">
            <Trash2 className="h-5 w-5 mr-2" />
            {t("confirmDeletion")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium">{t("question")}:</h3>
            <p className="text-lg mt-1">{question.question}</p>
          </div>

          <div>
            <h3 className="font-medium">{t("answerGuidelines")}:</h3>
            <div className="bg-muted p-4 rounded-md whitespace-pre-wrap text-sm mt-1">
              {question.answer_guidelines}
            </div>
          </div>

          <div>
            <h3 className="font-medium">{t("sampleAnswers")}:</h3>
            <p>
              {question.sampleAnswerCount} {t("sampleAnswers")}
            </p>
          </div>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{t("warning")}</AlertTitle>
            <AlertDescription>{t("warningConfirmation")}</AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild>
            <Link
              href={`/dashboard/coach-admin/programs/${programId}/questions/${questionId}`}
            >
              {t("cancel")}
            </Link>
          </Button>
          <form action={deleteQuestion}>
            <input type="hidden" name="questionId" value={questionId} />
            <input type="hidden" name="programId" value={programId} />
            <Button type="submit" variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              {t("deleteQuestion")}
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
