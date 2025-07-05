import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
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
  params: Promise<{ programId: string; questionId: string }>;
}) {
  const t = await getTranslations("coachAdminPortal.questionDetailPage");
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
    return redirect("/dashboard");
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

  // Get sample answers
  const sampleAnswers = await getSampleAnswers(questionId);

  return (
    <div className="container mx-auto py-6">
      {/* Back button */}
      <div className="mb-6">
        <Button asChild variant="outline" size="sm">
          <Link href={`/dashboard/coach-admin/programs/${programId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("navigation.backButton")}
          </Link>
        </Button>
      </div>

      {/* Header with action buttons */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("header.title")}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link
              href={`/dashboard/coach-admin/programs/${programId}/questions/${questionId}/edit`}
            >
              <Pencil className="h-4 w-4 mr-2" />
              {t("header.editButton")}
            </Link>
          </Button>
          <Button asChild variant="destructive">
            <Link
              href={`/dashboard/coach-admin/programs/${programId}/questions/${questionId}/delete`}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t("header.deleteButton")}
            </Link>
          </Button>
        </div>
      </div>

      {/* Question details card */}
      <Card className="mb-8">
        <CardContent className="pt-4">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-2">
                {t("questionDetails.questionLabel")}
              </h3>
              <div className="bg-muted p-4 rounded-md whitespace-pre-wrap">
                {question.question}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">
                {t("questionDetails.answerGuidelinesLabel")}
              </h3>
              <div className="bg-muted p-4 rounded-md whitespace-pre-wrap">
                {question.answer_guidelines}
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              {t("questionDetails.createdOn", {
                date: format(new Date(question.created_at), "MMMM d, yyyy"),
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Empty sample answers state */}
      {sampleAnswers.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("sampleAnswers.emptyState.title")}</CardTitle>
            <CardDescription>
              {t("sampleAnswers.emptyState.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link
                href={`/dashboard/coach-admin/programs/${programId}/questions/${questionId}/sample-answers/new`}
              >
                <Plus className="h-4 w-4 mr-2" />
                {t("sampleAnswers.emptyState.addFirstButton")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Sample answers list */}
      {sampleAnswers.length > 0 && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button asChild>
              <Link
                href={`/dashboard/coach-admin/programs/${programId}/questions/${questionId}/sample-answers/new`}
              >
                <Plus className="h-4 w-4 mr-2" />
                {t("sampleAnswers.list.addNewButton")}
              </Link>
            </Button>
          </div>
          {sampleAnswers.map((answer, index) => (
            <Card key={answer.id} id={`answer-${answer.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">
                      {t("sampleAnswers.list.sampleAnswerTitle", {
                        number: index + 1,
                      })}
                    </CardTitle>
                    <CardDescription>
                      {t("sampleAnswers.list.createdOn", {
                        date: format(
                          new Date(answer.created_at),
                          "MMMM d, yyyy"
                        ),
                      })}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link
                        href={`/dashboard/coach-admin/programs/${programId}/questions/${questionId}/sample-answers/${answer.id}/edit`}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        {t("sampleAnswers.list.editButton")}
                      </Link>
                    </Button>
                    <Button asChild variant="destructive" size="sm">
                      <Link
                        href={`/dashboard/coach-admin/programs/${programId}/questions/${questionId}/sample-answers/${answer.id}/delete`}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {t("sampleAnswers.list.deleteButton")}
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap bg-muted p-4 rounded-md">
                  {answer.answer}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
