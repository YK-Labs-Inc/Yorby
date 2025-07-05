import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Eye,
  Edit,
  Plus,
  BookOpen,
  Video,
  FileText,
  Image as ImageIcon,
  Type,
  GraduationCap,
} from "lucide-react";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { getTranslations } from "next-intl/server";
import { Logger } from "next-axiom";
import type { Database } from "@/utils/supabase/database.types";

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

// Function to verify program ownership
async function verifyProgramOwnership(programId: string, coachId: string) {
  const log = new Logger().with({
    function: "verifyProgramOwnership",
    programId,
    coachId,
  });
  const supabase = await createSupabaseServerClient();

  const { data: program, error } = await supabase
    .from("custom_jobs")
    .select("id, job_title, company_name")
    .eq("id", programId)
    .eq("coach_id", coachId)
    .single();

  if (error || !program) {
    log.error("Error verifying program ownership", { error });
    await log.flush();
    return null;
  }

  return program;
}

// Function to fetch course data with modules and lessons
async function getCourseData(programId: string) {
  const log = new Logger().with({
    function: "getCourseData",
    programId,
  });
  const supabase = await createSupabaseServerClient();

  // Fetch course
  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("*")
    .eq("custom_job_id", programId)
    .eq("deletion_status", "not_deleted")
    .single();

  if (courseError && courseError.code !== "PGRST116") {
    log.error("Error fetching course", { error: courseError });
    await log.flush();
  }

  if (!course) {
    return { course: null, modules: [] };
  }

  // Fetch modules with lessons and block counts
  const { data: modules, error: modulesError } = await supabase
    .from("course_modules")
    .select(
      `
      *,
      course_lessons (
        *,
        course_lesson_blocks (
          id,
          block_type
        )
      )
    `
    )
    .eq("course_id", course.id)
    .eq("deletion_status", "not_deleted")
    .order("order_index", { ascending: true });

  if (modulesError) {
    log.error("Error fetching modules", { error: modulesError });
    await log.flush();
    return { course, modules: [] };
  }

  // Sort lessons within each module
  const sortedModules =
    modules?.map((module) => ({
      ...module,
      course_lessons: module.course_lessons
        .filter((lesson: any) => lesson.deletion_status === "not_deleted")
        .sort((a: any, b: any) => a.order_index - b.order_index),
    })) || [];

  return { course, modules: sortedModules };
}

// Helper to get content type icons
function getContentTypeIcon(type: string) {
  switch (type) {
    case "text":
      return <Type className="h-3 w-3" />;
    case "video":
      return <Video className="h-3 w-3" />;
    case "pdf":
      return <FileText className="h-3 w-3" />;
    case "image":
      return <ImageIcon className="h-3 w-3" />;
    default:
      return null;
  }
}

// Helper to format content types for display
function formatContentTypes(
  blocks: Array<{
    id: string;
    block_type: Database["public"]["Enums"]["course_content_type"];
  }>
) {
  const typeCounts = blocks.reduce(
    (acc, block) => {
      acc[block.block_type] = (acc[block.block_type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const types = Object.entries(typeCounts).map(([type, count]) => {
    const label = type.charAt(0).toUpperCase() + type.slice(1);
    return count > 1 ? `${count} ${label}s` : `1 ${label}`;
  });

  return types.join(", ");
}

export default async function CourseOverviewPage({
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
  const coachData = await getCoachData(user.id);

  if (!coachData) {
    return redirect("/");
  }

  const { id: coachId } = coachData;

  // Verify program ownership
  const program = await verifyProgramOwnership(programId, coachId);

  if (!program) {
    return redirect("/dashboard/coach-admin/programs");
  }

  // Get course data
  const { course, modules } = await getCourseData(programId);

  const t = await getTranslations("coachAdminPortal.coursePage");

  // If no course exists, show create course UI
  if (!course) {
    return (
      <div className="container mx-auto py-6">
        {/* Back button */}
        <div className="mb-6">
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/coach-admin/programs/${programId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to {program.job_title}
            </Link>
          </Button>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Create Your Course</CardTitle>
            <CardDescription>
              Add educational content to complement your interview preparation
              program
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link
                href={`/dashboard/coach-admin/programs/${programId}/courses/new`}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Course
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <Button asChild variant="outline" size="sm">
          <Link href={`/dashboard/coach-admin/programs/${programId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Program
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-sm">
            UNPUBLISHED
          </Badge>
          <Button size="lg" disabled>
            Publish your course
          </Button>
        </div>
      </div>

      {/* Course Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          {course.title}
        </h1>
        {course.subtitle && (
          <p className="text-muted-foreground">{course.subtitle}</p>
        )}
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Curriculum Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <CardTitle>Create your curriculum</CardTitle>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/${coachData.slug}/${programId}/course`}>
                    <Eye className="mr-2 h-4 w-4" />
                    Preview curriculum
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <Link
                    href={`/dashboard/coach-admin/programs/${programId}/courses/${course.id}/edit`}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit curriculum
                  </Link>
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Curriculum Content */}
        <Card>
          <CardHeader>
            <CardTitle>Curriculum Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {modules.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  No modules added yet. Start building your curriculum.
                </p>
                <Button asChild>
                  <Link
                    href={`/dashboard/coach-admin/programs/${programId}/courses/${course.id}/edit`}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Module
                  </Link>
                </Button>
              </div>
            ) : (
              modules.map((module: any, moduleIndex: number) => (
                <div key={module.id} className="space-y-3">
                  {/* Module Header */}
                  <div className="font-semibold text-lg">{module.title}</div>

                  {/* Lessons */}
                  <div className="ml-4 space-y-2">
                    {module.course_lessons.map((lesson: any) => (
                      <div
                        key={lesson.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="font-medium">{lesson.title}</div>
                          {lesson.course_lesson_blocks.length > 0 && (
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>
                                {formatContentTypes(
                                  lesson.course_lesson_blocks
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Draft
                        </Badge>
                      </div>
                    ))}
                  </div>

                  {moduleIndex < modules.length - 1 && (
                    <Separator className="my-4" />
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
