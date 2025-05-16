import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  ChevronRight,
  Home,
  BookOpen,
} from "lucide-react";
import { format } from "date-fns";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/utils/supabase/server";

async function getCoachJobs(userId: string) {
  const supabase = await createSupabaseServerClient();

  // First, get the coach ID for the current user
  const { data: coachData, error: coachError } = await supabase
    .from("coaches")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (coachError || !coachData) {
    console.error("Error fetching coach data:", coachError);
    return { jobs: [], error: coachError || new Error("Coach not found") };
  }

  // Get all custom jobs for this coach
  const { data: jobs, error: jobsError } = await supabase
    .from("custom_jobs")
    .select(
      `
      id, 
      job_title, 
      company_name,
      created_at,
      custom_job_questions (count)
    `
    )
    .eq("coach_id", coachData.id)
    .order("created_at", { ascending: false });

  if (jobsError) {
    console.error("Error fetching jobs:", jobsError);
    return { jobs: [], error: jobsError };
  }

  return {
    jobs: jobs || [],
    coachId: coachData.id,
    error: null,
  };
}

export default async function CurriculumPage() {
  const supabase = await createSupabaseServerClient();

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Get coach jobs
  const { jobs, coachId, error } = await getCoachJobs(user.id);

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
            <BreadcrumbLink
              href="/dashboard/coach-admin/curriculum"
              className="font-semibold"
            >
              <BookOpen className="h-4 w-4 mr-1" />
              Curriculum
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Curriculum Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Create and manage job profiles with interview questions for your
            students.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/coach-admin/curriculum/new">
            <Plus className="h-4 w-4 mr-2" />
            Create Job
          </Link>
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <Card className="mb-6 border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">
              Error Loading Jobs
            </CardTitle>
            <CardDescription>
              There was a problem loading your curriculum jobs. Please try again
              later.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Empty state */}
      {!error && jobs.length === 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>No Jobs Created Yet</CardTitle>
            <CardDescription>
              Get started by creating your first job profile for your
              curriculum.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard/coach-admin/curriculum/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Job
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Jobs table */}
      {!error && jobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Job Profiles</CardTitle>
            <CardDescription>
              Manage your curriculum job profiles and their interview questions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Questions</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/dashboard/coach-admin/curriculum/${job.id}`}
                        className="hover:underline text-primary"
                      >
                        {job.job_title}
                      </Link>
                    </TableCell>
                    <TableCell>{job.company_name || "—"}</TableCell>
                    <TableCell>{job.custom_job_questions[0].count}</TableCell>
                    <TableCell>
                      {format(new Date(job.created_at), "MMM d, yyyy")}
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
                              href={`/dashboard/coach-admin/curriculum/${job.id}`}
                            >
                              <ChevronRight className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/dashboard/coach-admin/curriculum/${job.id}/edit`}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit Job
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            asChild
                          >
                            <Link
                              href={`/dashboard/coach-admin/curriculum/${job.id}/delete`}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Job
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
