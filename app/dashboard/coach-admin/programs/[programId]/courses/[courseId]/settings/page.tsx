"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Loader2, Save, Trash2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import type { Database } from "@/utils/supabase/database.types";

type Course = Database["public"]["Tables"]["courses"]["Row"];

export default function CourseSettingsPage({
  params,
}: {
  params: Promise<{ programId: string; courseId: string }>;
}) {
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { logInfo, logError } = useAxiomLogging();

  useEffect(() => {
    const fetchCourse = async () => {
      const { courseId } = await params;
      
      try {
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase
          .from("courses")
          .select("*")
          .eq("id", courseId)
          .single();

        if (error) {
          logError("Error fetching course", { error, courseId });
          toast({
            title: "Error",
            description: "Failed to load course settings",
            variant: "destructive",
          });
          return;
        }

        if (data) {
          setCourse(data);
          setTitle(data.title);
          setSubtitle(data.subtitle || "");
        }
      } catch (error) {
        logError("Exception fetching course", { error });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourse();
  }, [params, logError, toast]);

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
          description: "Failed to update course settings",
          variant: "destructive",
        });
        return;
      }

      setCourse(data);
      logInfo("Course updated successfully", { courseId: data.id });
      toast({
        title: "Success",
        description: "Course settings updated successfully",
      });
    } catch (error) {
      logError("Exception updating course", { error, courseId: course?.id });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!course) return;

    if (!confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
      return;
    }

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase
        .from("courses")
        .update({
          deletion_status: "deleted",
          updated_at: new Date().toISOString(),
        })
        .eq("id", course.id);

      if (error) {
        logError("Error deleting course", { error, courseId: course.id });
        toast({
          title: "Error",
          description: "Failed to delete course",
          variant: "destructive",
        });
        return;
      }

      logInfo("Course deleted successfully", { courseId: course.id });
      toast({
        title: "Success",
        description: "Course deleted successfully",
      });

      const { programId } = await params;
      router.push(`/dashboard/coach-admin/programs/${programId}`);
    } catch (error) {
      logError("Exception deleting course", { error, courseId: course?.id });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 max-w-2xl">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-2xl">
      {/* Back button */}
      <div className="mb-6">
        <Button asChild variant="outline" size="sm">
          <Link href={`/dashboard/coach-admin/programs/${params.programId}/courses`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Course
          </Link>
        </Button>
      </div>

      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Course Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your course details and preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>
              Update your course title and description
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Course Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">
                {title.length}/100 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle">Course Subtitle (Optional)</Label>
              <Textarea
                id="subtitle"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                rows={3}
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">
                {subtitle.length}/200 characters
              </p>
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

        {/* Course Thumbnail */}
        <Card>
          <CardHeader>
            <CardTitle>Course Thumbnail</CardTitle>
            <CardDescription>
              Add a thumbnail image for your course
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <p className="text-sm text-muted-foreground mb-3">
                No thumbnail uploaded yet
              </p>
              <Button variant="outline" disabled>
                Upload Image (Coming Soon)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible actions for this course
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={handleDeleteCourse}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Course
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}