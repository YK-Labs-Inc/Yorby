"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { ArrowLeft, Loader2, Plus } from "lucide-react";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";

export default function CreateCoursePage() {
  const { programId } = useParams<{ programId: string }>();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const { logInfo, logError } = useAxiomLogging();

  const handleCreateCourse = async () => {
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a course title",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
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

      logInfo("Course created successfully", { courseId: data.id, programId });
      toast({
        title: "Success",
        description: "Course created successfully",
      });

      // Redirect to course overview page
      router.push(`/dashboard/coach-admin/programs/${programId}/courses`);
    } catch (error) {
      logError("Exception creating course", { error, programId });
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-2xl">
      {/* Back button */}
      <div className="mb-6">
        <Button asChild variant="outline" size="sm">
          <Link href={`/dashboard/coach-admin/programs/${programId}/courses`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Course</CardTitle>
          <CardDescription>
            Set up your course structure to deliver educational content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Course Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Software Engineering Interview Mastery"
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
              placeholder="Brief description of what students will learn"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              rows={3}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">
              {subtitle.length}/200 characters
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleCreateCourse}
              disabled={isCreating || !title.trim()}
            >
              {isCreating ? (
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
            <Button variant="outline" asChild>
              <Link
                href={`/dashboard/coach-admin/programs/${programId}/courses`}
              >
                Cancel
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
