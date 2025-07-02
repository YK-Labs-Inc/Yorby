"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  BookOpen,
  Plus,
  Save,
  Loader2,
  GraduationCap,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import type { Database } from "@/utils/supabase/database.types";
import CourseModuleManager from "./CourseModuleManager";

type Course = Database["public"]["Tables"]["courses"]["Row"];

interface CourseEditorProps {
  programId: string;
  coachId: string;
}

export default function CourseEditor({
  programId,
  coachId,
}: CourseEditorProps) {
  const [course, setCourse] = useState<Course | null>(null);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  const { toast } = useToast();
  const { logInfo, logError } = useAxiomLogging();

  useEffect(() => {
    fetchCourse();
  }, [programId]);

  const fetchCourse = async () => {
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("custom_job_id", programId)
        .single();

      if (error && error.code !== "PGRST116") {
        logError("Error fetching course", { error, programId });
        toast({
          title: "Error",
          description: "Failed to load course data",
          variant: "destructive",
        });
      }

      if (data) {
        setCourse(data);
        setTitle(data.title);
        setSubtitle(data.subtitle || "");
      }
    } catch (error) {
      logError("Exception fetching course", { error, programId });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCourse = async () => {
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a course title",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingCourse(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("courses")
        .insert({
          custom_job_id: programId,
          title: title.trim(),
          subtitle: subtitle.trim() || null,
        })
        .select()
        .single();

      if (error) {
        logError("Error creating course", { error, programId });
        toast({
          title: "Error",
          description: "Failed to create course",
          variant: "destructive",
        });
        return;
      }

      setCourse(data);
      logInfo("Course created successfully", { courseId: data.id, programId });
      toast({
        title: "Success",
        description: "Course created successfully",
      });
    } catch (error) {
      logError("Exception creating course", { error, programId });
    } finally {
      setIsCreatingCourse(false);
    }
  };

  const handleUpdateCourse = async () => {
    if (!course || !title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a course title",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("courses")
        .update({
          title: title.trim(),
          subtitle: subtitle.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", course.id)
        .select()
        .single();

      if (error) {
        logError("Error updating course", { error, courseId: course.id });
        toast({
          title: "Error",
          description: "Failed to update course",
          variant: "destructive",
        });
        return;
      }

      setCourse(data);
      logInfo("Course updated successfully", { courseId: data.id });
      toast({
        title: "Success",
        description: "Course updated successfully",
      });
    } catch (error) {
      logError("Exception updating course", { error, courseId: course?.id });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!course) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Create Course
          </CardTitle>
          <CardDescription>
            Add educational content to complement your interview preparation program
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="course-title">Course Title</Label>
            <Input
              id="course-title"
              placeholder="e.g., Software Engineering Interview Mastery"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="course-subtitle">Course Subtitle (Optional)</Label>
            <Textarea
              id="course-subtitle"
              placeholder="Brief description of what students will learn"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              rows={2}
            />
          </div>
          <Button
            onClick={handleCreateCourse}
            disabled={isCreatingCourse || !title.trim()}
          >
            {isCreatingCourse ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Create Course
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Course Settings
          </CardTitle>
          <CardDescription>
            Manage your course title and subtitle
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="course-title">Course Title</Label>
            <Input
              id="course-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="course-subtitle">Course Subtitle (Optional)</Label>
            <Textarea
              id="course-subtitle"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              rows={2}
            />
          </div>
          <Button
            onClick={handleUpdateCourse}
            disabled={isSaving || !title.trim()}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <CourseModuleManager courseId={course.id} coachId={coachId} />
    </div>
  );
}