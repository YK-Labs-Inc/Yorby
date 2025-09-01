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
  ArrowLeft,
  GraduationCap,
  BookOpen,
} from "lucide-react";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { getServerUser } from "@/utils/auth/server";
import { getTranslations } from "next-intl/server";
import { Logger } from "next-axiom";
import QuestionStatusToggle from "../components/QuestionStatusToggle";
import KnowledgeBaseEditor from "../components/KnowledgeBaseEditor";
import { ShareLinkButton } from "../components/ShareLinkButton";
import { posthog } from "@/utils/tracking/serverUtils";

// Helper function to get coach data from user ID
async function getCoachData(userId: string) {
  const log = new Logger().with({
    function: "getCoachData",
    userId,
  });
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("coaches")
    .select("id, slug")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    log.error("Error fetching coach data", { error });
    await log.flush();
    return null;
  }

  return data;
}

// Function to fetch program and questions data
async function getProgramData(programId: string, coachId: string) {
  const log = new Logger().with({
    programId,
    coachId,
    function: "getProgramData",
  });
  const supabase = await createSupabaseServerClient();

  // Fetch program details
  const { data: program, error: programError } = await supabase
    .from("custom_jobs")
    .select("*")
    .eq("id", programId)
    .eq("coach_id", coachId)
    .single();

  if (programError || !program) {
    log.error("Error fetching program data", {
      programError,
    });
    await log.flush();
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
      created_at,
      publication_status,
      custom_job_question_sample_answers (count)
    `
    )
    .eq("custom_job_id", programId)
    .order("created_at", { ascending: false });

  if (questionsError) {
    log.error("Error fetching questions", { questionsError });
    await log.flush();
    return {
      program,
      questions: [],
      error: questionsError,
    };
  }

  return {
    program,
    questions: questions || [],
    error: null,
  };
}

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ programId: string }>;
}) {
  const { programId } = await params;

  // Get the current user
  const user = await getServerUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const supabase = await createSupabaseServerClient();

  // Verify the user is a coach
  const coachData = await getCoachData(user.id);

  if (!coachData) {
    // User is not a coach, redirect to dashboard
    return redirect("/");
  }

  const { id: coachId, slug: coachSlug } = coachData;

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

  // Check if course creation feature is enabled
  const isCourseCreationEnabled = await posthog.isFeatureEnabled(
    "enable-course-creation-feature",
    user.id
  );

  return (
    <div className="container mx-auto py-6">
      {/* Back button */}
      <div className="mb-6">
        <Button asChild variant="outline" size="sm">
          <Link href={`/dashboard/coach-admin/programs`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("backToPrograms")}
          </Link>
        </Button>
      </div>
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
          <ShareLinkButton coachSlug={coachSlug} programId={programId} />
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

      {/* Knowledge Base section */}
      <div className="mb-8">
        <KnowledgeBaseEditor programId={programId} coachId={coachId} />
      </div>

      {/* Course section */}
      {isCourseCreationEnabled && (
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Course Content
                </CardTitle>
                <CardDescription>
                  Create educational content to complement your interview prep
                </CardDescription>
              </div>
              <Button asChild>
                <Link href={`/dashboard/coach-admin/programs/${programId}/courses`}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Manage Course
                </Link>
              </Button>
            </div>
          </CardHeader>
        </Card>
      )}

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
                  <TableHead>{t("table.sampleAnswers")}</TableHead>
                  <TableHead>{t("table.created")}</TableHead>
                  <TableHead>{t("table.status")}</TableHead>
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
                        {question.question.length > 60
                          ? `${question.question.substring(0, 60)}...`
                          : question.question}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {question.custom_job_question_sample_answers[0].count}
                    </TableCell>
                    <TableCell>
                      {format(new Date(question.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <QuestionStatusToggle
                        questionId={question.id}
                        programId={programId}
                        initialStatus={
                          question.publication_status as "published" | "draft"
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/dashboard/coach-admin/programs/${programId}/questions/${question.id}`}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              {t("viewDetails")}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/dashboard/coach-admin/programs/${programId}/questions/${question.id}/edit`}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              {t("editQuestion")}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/dashboard/coach-admin/programs/${programId}/questions/${question.id}`}
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              {t("manageSampleAnswers")}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/dashboard/coach-admin/programs/${programId}/questions/${question.id}/delete`}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
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
    </div>
  );
}
