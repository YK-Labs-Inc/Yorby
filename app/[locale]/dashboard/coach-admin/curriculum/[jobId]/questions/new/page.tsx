import React from "react";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "@/utils/supabase/database.types";
import QuestionForm from "../../components/QuestionForm";
import { createQuestion } from "../../actions";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ChevronRight, Home, BookOpen, Briefcase, Plus } from "lucide-react";

// Helper function to get coach ID from user ID
async function getCoachId(userId: string) {
  const supabase = createServerComponentClient<Database>({ cookies });
  
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
  const supabase = createServerComponentClient<Database>({ cookies });
  
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

export default async function NewQuestionPage({ params }: { params: { jobId: string } }) {
  const supabase = createServerComponentClient<Database>({ cookies });
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
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
  
  // Handle form submission
  async function handleCreateQuestion(formData: FormData) {
    "use server";
    
    const result = await createQuestion(params.jobId, formData);
    
    if (result.success) {
      // Redirect to the job detail page
      redirect(`/dashboard/coach-admin/curriculum/${params.jobId}`);
    }
    
    return result;
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
            <BreadcrumbLink href={`/dashboard/coach-admin/curriculum/${params.jobId}`}>
              <Briefcase className="h-4 w-4 mr-1" />
              {job.job_title}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRight className="h-4 w-4" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbLink 
              href={`/dashboard/coach-admin/curriculum/${params.jobId}/questions/new`} 
              className="font-semibold"
            >
              <Plus className="h-4 w-4 mr-1" />
              New Question
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Add New Question</h1>
        <p className="text-muted-foreground mt-2">
          Create a new interview question for {job.job_title}
        </p>
      </div>
      
      <QuestionForm 
        onSubmit={handleCreateQuestion}
        onCancel={() => redirect(`/dashboard/coach-admin/curriculum/${params.jobId}`)}
      />
    </div>
  );
}
