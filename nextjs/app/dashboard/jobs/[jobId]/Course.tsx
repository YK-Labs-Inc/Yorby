import React from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  Video,
  FileText,
  Image as ImageIcon,
  Type,
  Clock,
  ChevronRight,
  Lock,
} from "lucide-react";
import type { Database } from "@/utils/supabase/database.types";

type CourseModule = {
  id: string;
  title: string;
  subtitle: string | null;
  order_index: number;
  course_lessons: CourseLesson[];
};

type CourseLesson = {
  id: string;
  title: string;
  subtitle: string | null;
  order_index: number;
  course_lesson_blocks: {
    id: string;
    block_type: Database["public"]["Enums"]["course_content_type"];
  }[];
};

type CourseData = {
  id: string;
  title: string;
  subtitle: string | null;
};

interface CourseProps {
  course: CourseData | null;
  modules: CourseModule[];
  jobId: string;
  isLocked: boolean;
}

// Helper to get content type icons
function getContentTypeIcon(type: string) {
  switch (type) {
    case "text":
      return <Type className="h-4 w-4" />;
    case "video":
      return <Video className="h-4 w-4" />;
    case "pdf":
      return <FileText className="h-4 w-4" />;
    case "image":
      return <ImageIcon className="h-4 w-4" />;
    default:
      return null;
  }
}

// Helper to get estimated time for content
function getEstimatedTime(blocks: { block_type: string }[]) {
  let totalMinutes = 0;
  blocks.forEach((block) => {
    switch (block.block_type) {
      case "text":
        totalMinutes += 3; // 3 minutes per text block
        break;
      case "video":
        totalMinutes += 10; // 10 minutes per video
        break;
      case "pdf":
        totalMinutes += 5; // 5 minutes per PDF
        break;
      case "image":
        totalMinutes += 1; // 1 minute per image
        break;
    }
  });
  return totalMinutes;
}

// Helper to format time
function formatTime(minutes: number) {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

export default function Course({
  course,
  modules,
  jobId,
  isLocked,
}: CourseProps) {
  if (!course) {
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
            <BookOpen className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle>No Course Available</CardTitle>
          <CardDescription>
            This program doesn't have any course content yet.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const totalLessons = modules.reduce(
    (acc, module) => acc + module.course_lessons.length,
    0
  );
  const totalTime = modules.reduce((acc, module) => {
    const moduleTime = module.course_lessons.reduce(
      (lessonAcc, lesson) =>
        lessonAcc + getEstimatedTime(lesson.course_lesson_blocks),
      0
    );
    return acc + moduleTime;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Course Header */}
      <Card>
        <CardHeader>
          <div className="space-y-4">
            <div>
              <CardTitle className="text-2xl">{course.title}</CardTitle>
              {course.subtitle && (
                <CardDescription className="text-base mt-2">
                  {course.subtitle}
                </CardDescription>
              )}
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span>
                  {modules.length} {modules.length === 1 ? "module" : "modules"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>
                  {totalLessons} {totalLessons === 1 ? "lesson" : "lessons"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{formatTime(totalTime)}</span>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Course Content */}
      <Card>
        <CardHeader>
          <CardTitle>Course Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {modules.map((module, moduleIndex) => (
            <div key={module.id}>
              {/* Module Header */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold">{module.title}</h3>
                {module.subtitle && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {module.subtitle}
                  </p>
                )}
              </div>

              {/* Lessons */}
              <div className="space-y-2">
                {module.course_lessons.map((lesson, lessonIndex) => {
                  const lessonTime = getEstimatedTime(
                    lesson.course_lesson_blocks
                  );
                  const contentTypes = lesson.course_lesson_blocks.reduce(
                    (acc, block) => {
                      if (!acc[block.block_type]) {
                        acc[block.block_type] = 0;
                      }
                      acc[block.block_type]++;
                      return acc;
                    },
                    {} as Record<string, number>
                  );

                  return (
                    <Link
                      key={lesson.id}
                      href={
                        isLocked
                          ? "#"
                          : `/dashboard/jobs/${jobId}/course/lessons/${lesson.id}`
                      }
                      className={`block ${isLocked ? "cursor-not-allowed" : ""}`}
                    >
                      <div
                        className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                          isLocked
                            ? "bg-muted/50 opacity-75"
                            : "hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                            {lessonIndex + 1}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="font-medium">{lesson.title}</div>
                            {lesson.subtitle && (
                              <div className="text-sm text-muted-foreground">
                                {lesson.subtitle}
                              </div>
                            )}
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTime(lessonTime)}
                              </span>
                              {Object.entries(contentTypes).map(
                                ([type, count]) => (
                                  <span
                                    key={type}
                                    className="flex items-center gap-1"
                                  >
                                    {getContentTypeIcon(type)}
                                    <span>{count}</span>
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                        {isLocked ? (
                          <Lock className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>

              {moduleIndex < modules.length - 1 && (
                <Separator className="mt-6" />
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Locked state message */}
      {isLocked && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <Lock className="h-5 w-5" />
              Course Locked
            </CardTitle>
            <CardDescription className="text-amber-700">
              Unlock this job to access the course content and start learning.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
