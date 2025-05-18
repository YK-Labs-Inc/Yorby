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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

// Function to fetch program and questions data
async function getProgramData(programId: string, coachId: string) {
  const supabase = await createSupabaseServerClient();

  // Fetch program details
  const { data: program, error: programError } = await supabase
    .from("custom_jobs")
    .select("*")
    .eq("id", programId)
    .eq("coach_id", coachId)
    .single();

  if (programError || !program) {
    console.error("Error fetching program data:", programError);
    return {
      program: null,
      questions: [],
      error: programError || new Error("Program not found"),
    };
  }

  // Fetch questions for this program
  const { data: questions, error: questionsError } = await supabase
    .from("custom_job_questions")
    .select(
      `
      id,
      question,
      answer_guidelines,
      question_type,
      created_at,
      custom_job_question_sample_answers (count)
    `
    )
    .eq("custom_job_id", programId)
    .order("created_at", { ascending: false });

  if (questionsError) {
    console.error("Error fetching questions:", questionsError);
    return { program, questions: [], error: questionsError };
  }

  return { program, questions: questions || [], error: null };
}

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ programId: string }>;
}) {
  const { programId } = await params;
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
    return redirect("/");
  }

  // Get program and questions data
  const { program, questions, error } = await getProgramData(
    programId,
    coachId
  );

  if (error || !program) {
    // Program not found or doesn't belong to this coach
    return redirect("/dashboard/coach-admin/programs");
  }

  const t = await getTranslations(
    "coachAdminPortal.programsPage.programDetailPage"
  );

  return (
    <div className="container mx-auto py-6">
      {/* Header with action buttons */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("headerTitle", { programTitle: program.job_title })}
          </h1>
          {program.company_name && (
            <p className="text-muted-foreground mt-1">
              {t("headerCompany", { companyName: program.company_name })}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/dashboard/coach-admin/programs/${programId}/edit`}>
              <Pencil className="h-4 w-4 mr-2" />
              {t("editButton")}
            </Link>
          </Button>
          <Button asChild variant="destructive">
            <Link href={`/dashboard/coach-admin/programs/${programId}/delete`}>
              <Trash2 className="h-4 w-4 mr-2" />
              {t("deleteButton")}
            </Link>
          </Button>
        </div>
      </div>

      {/* Questions section */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">
          {t("questionsSectionTitle")}
        </h2>
        <Button asChild>
          <Link
            href={`/dashboard/coach-admin/programs/${programId}/questions/new`}
          >
            <Plus className="h-4 w-4 mr-2" />
            {t("addQuestionButton")}
          </Link>
        </Button>
      </div>

      {/* Empty questions state */}
      {questions.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("emptyQuestionsTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link
                href={`/dashboard/coach-admin/programs/${programId}/questions/new`}
              >
                <Plus className="h-4 w-4 mr-2" />
                {t("addFirstQuestionButton")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Questions list */}
      {questions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              {t("questionsListTitle", { count: questions.length })}
            </CardTitle>
            <CardDescription>{t("questionsListDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("table.question")}</TableHead>
                  <TableHead>{t("table.type")}</TableHead>
                  <TableHead>{t("table.sampleAnswers")}</TableHead>
                  <TableHead>{t("table.created")}</TableHead>
                  <TableHead className="text-right">
                    {t("table.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questions.map((question) => (
                  <TableRow key={question.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/dashboard/coach-admin/programs/${programId}/questions/${question.id}`}
                        className="hover:underline text-primary"
                      >
                        {question.question.length > 80
                          ? `${question.question.substring(0, 80)}...`
                          : question.question}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {question.question_type === "ai_generated"
                          ? t("typeAIGenerated")
                          : t("typeManual")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {question.custom_job_question_sample_answers[0].count}
                    </TableCell>
                    <TableCell>
                      {format(new Date(question.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">
                              {t("table.actions")}
                            </span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/dashboard/coach-admin/programs/${programId}/questions/${question.id}`}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              {t("viewDetails")}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/dashboard/coach-admin/programs/${programId}/questions/${question.id}/edit`}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              {t("editQuestion")}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/dashboard/coach-admin/programs/${programId}/questions/${question.id}/sample-answers`}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              {t("manageSampleAnswers")}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            asChild
                          >
                            <Link
                              href={`/dashboard/coach-admin/programs/${programId}/questions/${question.id}/delete`}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {t("deleteQuestion")}
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Questions preview section */}
      {questions.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-semibold tracking-tight mb-4">
            {t("questionDetailsSectionTitle")}
          </h2>
          <div className="space-y-6">
            {questions.map((question) => (
              <Card key={question.id} id={`question-${question.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {question.question}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        <Badge variant="outline" className="mr-2">
                          {question.question_type === "ai_generated"
                            ? t("typeAIGenerated")
                            : t("typeManual")}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {t("createdOn", {
                            date: format(
                              new Date(question.created_at),
                              "MMMM d, yyyy"
                            ),
                          })}
                        </span>
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">{t("table.actions")}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/dashboard/coach-admin/programs/${programId}/questions/${question.id}`}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            {t("viewDetails")}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/dashboard/coach-admin/programs/${programId}/questions/${question.id}/edit`}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            {t("editQuestion")}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          asChild
                        >
                          <Link
                            href={`/dashboard/coach-admin/programs/${programId}/questions/${question.id}/delete`}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {t("deleteQuestion")}
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2">
                        {t("answerGuidelinesTitle")}
                      </h3>
                      <div className="bg-muted p-4 rounded-md whitespace-pre-wrap text-sm">
                        {question.answer_guidelines}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium">
                          {t("sampleAnswersLabel")}
                        </h3>
                        <Badge variant="secondary">
                          {question.custom_job_question_sample_answers[0].count}
                        </Badge>
                      </div>
                      <Button asChild size="sm" variant="outline">
                        <Link
                          href={`/dashboard/coach-admin/programs/${programId}/questions/${question.id}/sample-answers`}
                        >
                          {t("manageSampleAnswersButton")}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
