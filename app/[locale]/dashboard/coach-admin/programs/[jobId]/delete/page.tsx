import React from "react";
import { redirect } from "next/navigation";
import { deleteCustomJob } from "../../actions";
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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertTriangle,
  ChevronRight,
  Home,
  BookOpen,
  Briefcase,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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

// Function to fetch job details and count related questions
async function getJobDetails(jobId: string, coachId: string) {
  const supabase = await createSupabaseServerClient();

  // Fetch job details
  const { data: job, error: jobError } = await supabase
    .from("custom_jobs")
    .select("*")
    .eq("id", jobId)
    .eq("coach_id", coachId)
    .single();

  if (jobError || !job) {
    console.error("Error fetching job details:", jobError);
    return null;
  }

  // Count questions for this job
  const { count: questionCount, error: countError } = await supabase
    .from("custom_job_questions")
    .select("*", { count: "exact", head: true })
    .eq("custom_job_id", jobId);

  if (countError) {
    console.error("Error counting questions:", countError);
    return { ...job, questionCount: 0 };
  }

  return { ...job, questionCount: questionCount || 0 };
}

export default async function DeleteJobPage({
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
    return redirect("/dashboard");
  }

  // Get job details
  const job = await getJobDetails(jobId, coachId);

  if (!job) {
    // Job not found or doesn't belong to this coach
    return redirect("/dashboard/coach-admin/curriculum");
  }

  // Handle job deletion
  async function handleDeleteJob(formData: FormData) {
    "use server";
    const jobId = formData.get("jobId") as string;
    await deleteCustomJob(jobId);
    redirect(`/dashboard/coach-admin/curriculum`);
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
              href={`/dashboard/coach-admin/curriculum/${jobId}/delete`}
              className="font-semibold"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete Job
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Back button */}
      <div className="mb-6">
        <Button asChild variant="outline" size="sm">
          <Link href={`/dashboard/coach-admin/curriculum/${jobId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Job Profile
          </Link>
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Delete Job Profile
        </h1>
        <p className="text-muted-foreground mt-2">
          Confirm deletion of this job profile from your curriculum
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-destructive flex items-center">
            <Trash2 className="h-5 w-5 mr-2" />
            Confirm Deletion
          </CardTitle>
          <CardDescription>
            You are about to delete the following job profile from your
            curriculum
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium">Job Title:</h3>
            <p className="text-lg">{job.job_title}</p>
          </div>

          {job.company_name && (
            <div>
              <h3 className="font-medium">Company:</h3>
              <p>{job.company_name}</p>
            </div>
          )}

          <div>
            <h3 className="font-medium">Associated Questions:</h3>
            <p>
              {job.questionCount} question{job.questionCount !== 1 ? "s" : ""}
            </p>
          </div>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              This action cannot be undone. Deleting this job profile will also
              delete all associated questions and sample answers. Students will
              no longer be able to practice with this job profile.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/coach-admin/curriculum/${jobId}`}>
              Cancel
            </Link>
          </Button>
          <form action={handleDeleteJob}>
            <Button type="submit" variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Job Profile
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
