import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { getServerUser } from "@/utils/auth/server";
import { Logger } from "next-axiom";
import CourseModuleManager from "../../../../components/CourseModuleManager";

// Helper function to get coach data from user ID
async function getCoachData(userId: string) {
  const log = new Logger().with({
    function: "getCoachData",
    userId,
  });
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("coaches")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    log.error("Error fetching coach data", { error });
    await log.flush();
    return null;
  }

  return data;
}

// Function to verify course ownership
async function verifyCourseOwnership(courseId: string, programId: string, coachId: string) {
  const log = new Logger().with({
    function: "verifyCourseOwnership",
    courseId,
    programId,
    coachId,
  });
  const supabase = await createSupabaseServerClient();

  const { data: course, error } = await supabase
    .from("courses")
    .select(`
      id, 
      title,
      custom_jobs!inner (
        id,
        coach_id
      )
    `)
    .eq("id", courseId)
    .eq("custom_job_id", programId)
    .eq("custom_jobs.coach_id", coachId)
    .single();

  if (error || !course) {
    log.error("Error verifying course ownership", { error });
    await log.flush();
    return null;
  }

  return course;
}

export default async function EditCurriculumPage({
  params,
}: {
  params: Promise<{ programId: string; courseId: string }>;
}) {
  const { programId, courseId } = await params;

  // Get the current user
  const user = await getServerUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Verify the user is a coach
  const coachData = await getCoachData(user.id);

  if (!coachData) {
    return redirect("/");
  }

  const { id: coachId } = coachData;

  // Verify course ownership
  const course = await verifyCourseOwnership(courseId, programId, coachId);

  if (!course) {
    return redirect("/dashboard/coach-admin/programs");
  }

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <Button asChild variant="outline" size="sm">
          <Link href={`/dashboard/coach-admin/programs/${programId}/courses`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Course Overview
          </Link>
        </Button>
      </div>

      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Edit Curriculum
        </h1>
        <p className="text-muted-foreground">
          Organize your course content into modules and lessons
        </p>
      </div>

      {/* Module Manager */}
      <CourseModuleManager courseId={courseId} coachId={coachId} />
    </div>
  );
}