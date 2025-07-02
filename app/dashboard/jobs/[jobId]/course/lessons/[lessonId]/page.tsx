import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import LessonContentViewer from "./LessonContentViewer";
import type { Tables } from "@/utils/supabase/database.types";

export type LessonBlock = Tables<"course_lesson_blocks"> & {
  course_lesson_files:
    | (Tables<"course_lesson_files"> & {
        course_lesson_files_mux_metadata: Tables<"course_lesson_files_mux_metadata"> | null;
      })
    | null;
};

async function fetchLessonData(lessonId: string, userId: string) {
  const supabase = await createSupabaseServerClient();

  // First, fetch the lesson with its module and course
  const { data: lesson, error: lessonError } = await supabase
    .from("course_lessons")
    .select(
      `
      *,
      course_modules!inner(
        *,
        courses!inner(
          *,
          custom_jobs!inner(*)
        )
      ),
      course_lesson_blocks(
        *,
        course_lesson_files(
          id,
          display_name,
          file_path,
          mime_type,
          bucket_name,
          course_lesson_files_mux_metadata(*)
        )
      )
    `
    )
    .eq("id", lessonId)
    .eq("deletion_status", "not_deleted")
    .single();

  if (lessonError || !lesson) {
    return null;
  }

  // Check if user has access (either owns the job or is enrolled)
  const jobId = lesson.course_modules.courses.custom_job_id;
  const job = lesson.course_modules.courses.custom_jobs;

  // Check if user has subscription
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  const hasSubscription = subscription !== null;

  // Check if user owns the job
  if (job.user_id === userId) {
    return {
      lesson,
      hasAccess: true,
      isLocked: job.status === "locked" && !hasSubscription,
    };
  }

  // Check if user is enrolled
  const { data: enrollment } = await supabase
    .from("custom_job_enrollments")
    .select("*")
    .eq("custom_job_id", jobId)
    .eq("user_id", userId)
    .single();

  if (enrollment) {
    return {
      lesson,
      hasAccess: true,
      isLocked: job.status === "locked" && !hasSubscription,
    };
  }

  return { lesson, hasAccess: false, isLocked: true };
}

async function fetchAdjacentLessons(
  moduleId: string,
  currentLessonIndex: number
) {
  const supabase = await createSupabaseServerClient();

  const { data: lessons } = await supabase
    .from("course_lessons")
    .select("id, title, order_index")
    .eq("module_id", moduleId)
    .eq("deletion_status", "not_deleted")
    .order("order_index", { ascending: true });

  if (!lessons) return { prevLesson: null, nextLesson: null };

  const currentIndex = lessons.findIndex(
    (l) => l.order_index === currentLessonIndex
  );
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

  return { prevLesson, nextLesson };
}

export default async function LessonViewerPage({
  params,
}: {
  params: Promise<{ jobId: string; lessonId: string }>;
}) {
  const { jobId, lessonId } = await params;
  const supabase = await createSupabaseServerClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch lesson data
  const lessonData = await fetchLessonData(lessonId, user.id);

  if (!lessonData || !lessonData.hasAccess) {
    return redirect(`/dashboard/jobs/${jobId}`);
  }

  const { lesson, isLocked } = lessonData;

  if (isLocked) {
    return redirect(`/dashboard/jobs/${jobId}?view=course`);
  }

  // Fetch adjacent lessons
  const { prevLesson, nextLesson } = await fetchAdjacentLessons(
    lesson.module_id,
    lesson.order_index
  );

  // Sort blocks by order_index with proper typing
  const sortedBlocks = lesson.course_lesson_blocks.sort(
    (a, b) => a.order_index - b.order_index
  ) as LessonBlock[];

  return (
    <div className="container mx-auto py-6">
      {/* Navigation */}
      <div className="mb-6">
        <Button asChild variant="outline" size="sm">
          <Link href={`/dashboard/jobs/${jobId}?view=course`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Course
          </Link>
        </Button>
      </div>

      {/* Lesson Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground mb-2">
                {lesson.course_modules.title}
              </div>
              <CardTitle className="text-2xl">{lesson.title}</CardTitle>
              {lesson.subtitle && (
                <CardDescription className="text-base mt-2">
                  {lesson.subtitle}
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Lesson Content */}
      <div className="space-y-6 mb-8">
        {sortedBlocks.map((block) => (
          <LessonContentViewer key={block.id} block={block} />
        ))}
      </div>

      {/* Navigation Footer */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {prevLesson ? (
              <Button asChild variant="outline">
                <Link
                  href={`/dashboard/jobs/${jobId}/course/lessons/${prevLesson.id}`}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous: {prevLesson.title}
                </Link>
              </Button>
            ) : (
              <div />
            )}
            {nextLesson ? (
              <Button asChild>
                <Link
                  href={`/dashboard/jobs/${jobId}/course/lessons/${nextLesson.id}`}
                >
                  Next: {nextLesson.title}
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            ) : (
              <Button asChild variant="default">
                <Link href={`/dashboard/jobs/${jobId}?view=course`}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Back to Course
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
