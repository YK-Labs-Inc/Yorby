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
  Home,
  BookOpen,
  Briefcase,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { P } from "framer-motion/dist/types.d-6pKw1mTI";

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

// Function to fetch job and questions data
async function getJobData(jobId: string, coachId: string) {
  const supabase = await createSupabaseServerClient();

  // Fetch job details
  const { data: job, error: jobError } = await supabase
    .from("custom_jobs")
    .select("*")
    .eq("id", jobId)
    .eq("coach_id", coachId)
    .single();

  if (jobError || !job) {
    console.error("Error fetching job data:", jobError);
    return {
      job: null,
      questions: [],
      error: jobError || new Error("Job not found"),
    };
  }

  // Fetch questions for this job
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
    .eq("custom_job_id", jobId)
    .order("created_at", { ascending: false });

  if (questionsError) {
    console.error("Error fetching questions:", questionsError);
    return { job, questions: [], error: questionsError };
  }

  return { job, questions: questions || [], error: null };
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
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

  // Get job and questions data
  const { job, questions, error } = await getJobData(jobId, coachId);

  if (error || !job) {
    // Job not found or doesn't belong to this coach
    return redirect("/dashboard/coach-admin/programs");
  }

  return (
    <div className="container mx-auto py-6">
      {/* Header with action buttons */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{job.job_title}</h1>
          {job.company_name && (
            <p className="text-muted-foreground mt-1">{job.company_name}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/dashboard/coach-admin/programs/${jobId}/edit`}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit Job
            </Link>
          </Button>
          <Button asChild variant="destructive">
            <Link href={`/dashboard/coach-admin/programs/${jobId}/delete`}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Job
            </Link>
          </Button>
        </div>
      </div>

      {/* Job details card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
          <CardDescription>
            Information about this job profile in your programs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium">Job Description</h3>
              <p className="mt-1 whitespace-pre-wrap">{job.job_description}</p>
            </div>

            {job.company_description && (
              <div>
                <h3 className="text-sm font-medium">Company Description</h3>
                <p className="mt-1 whitespace-pre-wrap">
                  {job.company_description}
                </p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
              <Badge
                variant={job.status === "unlocked" ? "outline" : "secondary"}
              >
                {job.status === "unlocked" ? "Unlocked" : "Locked"}
              </Badge>
            </div>

            <div className="text-sm text-muted-foreground">
              Created on {format(new Date(job.created_at), "MMMM d, yyyy")}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions section */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">
          Interview Questions
        </h2>
        <Button asChild>
          <Link href={`/dashboard/coach-admin/programs/${jobId}/questions/new`}>
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Link>
        </Button>
      </div>

      {/* Empty questions state */}
      {questions.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>No Questions Added Yet</CardTitle>
            <CardDescription>
              Add interview questions to help your students prepare for this
              job.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link
                href={`/dashboard/coach-admin/programs/${jobId}/questions/new`}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Question
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Questions list */}
      {questions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Interview Questions ({questions.length})</CardTitle>
            <CardDescription>
              Questions and answer guidelines for this job profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Question</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Sample Answers</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questions.map((question) => (
                  <TableRow key={question.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/dashboard/coach-admin/programs/${jobId}/questions/${question.id}`}
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
                          ? "AI Generated"
                          : "Manual"}
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
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/dashboard/coach-admin/programs/${jobId}/questions/${question.id}`}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/dashboard/coach-admin/programs/${jobId}/questions/${question.id}/edit`}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit Question
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/dashboard/coach-admin/programs/${jobId}/questions/${question.id}/sample-answers`}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Manage Sample Answers
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            asChild
                          >
                            <Link
                              href={`/dashboard/coach-admin/programs/${jobId}/questions/${question.id}/delete`}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Question
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
            Question Details
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
                            ? "AI Generated"
                            : "Manual"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Created on{" "}
                          {format(
                            new Date(question.created_at),
                            "MMMM d, yyyy"
                          )}
                        </span>
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/dashboard/coach-admin/programs/${jobId}/questions/${question.id}`}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/dashboard/coach-admin/programs/${jobId}/questions/${question.id}/edit`}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit Question
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          asChild
                        >
                          <Link
                            href={`/dashboard/coach-admin/programs/${jobId}/questions/${question.id}/delete`}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Question
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
                        Answer Guidelines
                      </h3>
                      <div className="bg-muted p-4 rounded-md whitespace-pre-wrap text-sm">
                        {question.answer_guidelines}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium">Sample Answers:</h3>
                        <Badge variant="secondary">
                          {question.custom_job_question_sample_answers[0].count}
                        </Badge>
                      </div>
                      <Button asChild size="sm" variant="outline">
                        <Link
                          href={`/dashboard/coach-admin/programs/${jobId}/questions/${question.id}/sample-answers`}
                        >
                          Manage Sample Answers
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
