import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Logger } from "next-axiom";
import LessonContentEditor from "@/app/dashboard/coach-admin/programs/components/LessonContentEditor";

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

// Function to fetch lesson data
async function getLessonData(lessonId: string, coachId: string) {
  const log = new Logger().with({
    lessonId,
    coachId,
    function: "getLessonData",
  });
  const supabase = await createSupabaseServerClient();

  // Fetch lesson with module and course details
  const { data: lesson, error } = await supabase
    .from("course_lessons")
    .select(`
      *,
      course_modules!inner (
        id,
        title,
        course_id,
        courses!inner (
          id,
          title,
          custom_job_id,
          custom_jobs!inner (
            id,
            job_title,
            coach_id
          )
        )
      )
    `)
    .eq("id", lessonId)
    .eq("course_modules.courses.custom_jobs.coach_id", coachId)
    .single();

  if (error || !lesson) {
    log.error("Error fetching lesson data", { error });
    await log.flush();
    return null;
  }

  return lesson;
}

export default async function LessonEditorPage({
  params,
}: {
  params: Promise<{ programId: string; lessonId: string }>;
}) {
  const { programId, lessonId } = await params;
  const supabase = await createSupabaseServerClient();

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Verify the user is a coach
  const coachData = await getCoachData(user.id);

  if (!coachData) {
    return redirect("/");
  }

  // Get lesson data
  const lesson = await getLessonData(lessonId, coachData.id);

  if (!lesson) {
    return redirect(`/dashboard/coach-admin/programs/${programId}`);
  }

  return (
    <div className="container mx-auto py-6">
      {/* Navigation breadcrumb */}
      <div className="mb-6">
        <Button asChild variant="outline" size="sm">
          <Link href={`/dashboard/coach-admin/programs/${programId}/courses/${lesson.course_modules.course_id}/edit`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Curriculum
          </Link>
        </Button>
      </div>

      {/* Lesson header */}
      <div className="mb-8">
        <div className="text-sm text-muted-foreground mb-2">
          {lesson.course_modules.courses.custom_jobs.job_title} / {lesson.course_modules.title}
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          {lesson.title}
        </h1>
        {lesson.subtitle && (
          <p className="text-muted-foreground mt-1">{lesson.subtitle}</p>
        )}
      </div>

      {/* Lesson content editor */}
      <LessonContentEditor
        lessonId={lessonId}
        coachId={coachData.id}
        programId={programId}
      />
    </div>
  );
}