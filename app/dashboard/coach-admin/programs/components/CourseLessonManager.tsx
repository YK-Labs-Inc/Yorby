"use client";

import React, { useState, useEffect } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  FileText,
  Loader2,
  GripVertical,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import type { Database } from "@/utils/supabase/database.types";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { useParams } from "next/navigation";

type CourseLesson = Database["public"]["Tables"]["course_lessons"]["Row"];

interface CourseLessonManagerProps {
  moduleId: string;
  coachId: string;
}

// Sortable Lesson Component
const SortableLesson = ({
  lesson,
  programId,
  handleOpenDialog,
  handleDeleteLesson,
  isDragging,
}: {
  lesson: CourseLesson;
  programId: string;
  handleOpenDialog: (lesson?: CourseLesson) => void;
  handleDeleteLesson: (id: string) => void;
  isDragging: boolean;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("relative transition-all", isDragging && "z-50")}
    >
      <div
        className={cn(
          "flex items-center gap-2 p-3 rounded-md border bg-background transition-opacity",
          isDragging && "opacity-30"
        )}
      >
        <div
          className="cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm">{lesson.title}</p>
          {lesson.subtitle && (
            <p className="text-xs text-muted-foreground">{lesson.subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link
              href={`/dashboard/coach-admin/programs/${programId}/courses/lessons/${lesson.id}`}
            >
              <FileText className="mr-2 h-3 w-3" />
              Edit Content
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleOpenDialog(lesson)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDeleteLesson(lesson.id)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Lesson
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

// Fetcher function for SWR
const fetchLessons = async (_key: string, moduleId: string) => {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("course_lessons")
    .select("*")
    .eq("module_id", moduleId)
    .eq("deletion_status", "not_deleted")
    .order("order_index", { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
};

export default function CourseLessonManager({
  moduleId,
  coachId,
}: CourseLessonManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<CourseLesson | null>(null);
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonSubtitle, setLessonSubtitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const { toast } = useToast();
  const { logInfo, logError } = useAxiomLogging();
  const params = useParams<{ programId: string }>();
  const programId = params.programId;

  // Use SWR for data fetching
  const { data: lessons = [], error, isLoading, mutate } = useSWR(
    [`/course-lessons/${moduleId}`, moduleId],
    ([key, id]) => fetchLessons(key, id),
    {
      revalidateOnFocus: false,
      revalidateOnMount: true,
    }
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle SWR error in useEffect to avoid setState during render
  useEffect(() => {
    if (error) {
      logError("Error fetching lessons", { error, moduleId });
      toast({
        title: "Error",
        description: "Failed to load lessons",
        variant: "destructive",
      });
    }
  }, [error, moduleId, logError, toast]);

  const handleSaveLesson = async () => {
    if (!lessonTitle.trim()) {
      toast({
        title: "Error",
        description: "Please enter a lesson title",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const supabase = createSupabaseBrowserClient();

      if (editingLesson) {
        const { error } = await supabase
          .from("course_lessons")
          .update({
            title: lessonTitle.trim(),
            subtitle: lessonSubtitle.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingLesson.id);

        if (error) {
          logError("Error updating lesson", {
            error,
            lessonId: editingLesson.id,
          });
          toast({
            title: "Error",
            description: "Failed to update lesson",
            variant: "destructive",
          });
          return;
        }

        logInfo("Lesson updated successfully", { lessonId: editingLesson.id });
        toast({
          title: "Success",
          description: "Lesson updated successfully",
        });
      } else {
        const newOrderIndex = lessons.length;
        const { error } = await supabase.from("course_lessons").insert({
          module_id: moduleId,
          title: lessonTitle.trim(),
          subtitle: lessonSubtitle.trim() || null,
          order_index: newOrderIndex,
        });

        if (error) {
          logError("Error creating lesson", { error, moduleId });
          toast({
            title: "Error",
            description: "Failed to create lesson",
            variant: "destructive",
          });
          return;
        }

        logInfo("Lesson created successfully", { moduleId });
        toast({
          title: "Success",
          description: "Lesson created successfully",
        });
      }

      await mutate();
      handleCloseDialog();
    } catch (error) {
      logError("Exception saving lesson", { error, moduleId });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase
        .from("course_lessons")
        .update({
          deletion_status: "deleted",
          updated_at: new Date().toISOString(),
        })
        .eq("id", lessonId);

      if (error) {
        logError("Error deleting lesson", { error, lessonId });
        toast({
          title: "Error",
          description: "Failed to delete lesson",
          variant: "destructive",
        });
        return;
      }

      logInfo("Lesson deleted successfully", { lessonId });
      toast({
        title: "Success",
        description: "Lesson deleted successfully",
      });
      await mutate();
    } catch (error) {
      logError("Exception deleting lesson", { error, lessonId });
    }
  };

  const handleOpenDialog = (lesson?: CourseLesson) => {
    if (lesson) {
      setEditingLesson(lesson);
      setLessonTitle(lesson.title);
      setLessonSubtitle(lesson.subtitle || "");
    } else {
      setEditingLesson(null);
      setLessonTitle("");
      setLessonSubtitle("");
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingLesson(null);
    setLessonTitle("");
    setLessonSubtitle("");
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = lessons.findIndex((lesson) => lesson.id === active.id);
    const newIndex = lessons.findIndex((lesson) => lesson.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Optimistically update the UI
    const newLessons = arrayMove(lessons, oldIndex, newIndex);
    mutate(newLessons, false); // Update local data without revalidation
    setIsReordering(true);

    try {
      const supabase = createSupabaseBrowserClient();

      // To avoid unique constraint violations, we need to update lessons in two phases:
      // 1. First, set all lessons to temporary high order_index values
      // 2. Then set them to their final positions

      const tempOffset = 10000; // High offset to avoid conflicts

      // Phase 1: Move all lessons to temporary positions
      const tempUpdatePromises = newLessons.map((lesson, index) =>
        supabase
          .from("course_lessons")
          .update({
            order_index: tempOffset + index,
            updated_at: new Date().toISOString(),
          })
          .eq("id", lesson.id)
      );

      const tempResults = await Promise.all(tempUpdatePromises);
      const failedTempUpdate = tempResults.find((result) => result.error);

      if (failedTempUpdate?.error) {
        logError("Error in temp reordering phase", {
          error: failedTempUpdate.error,
        });
        toast({
          title: "Error",
          description: "Failed to reorder lessons",
          variant: "destructive",
        });
        await mutate();
        return;
      }

      // Phase 2: Move lessons to their final positions
      const finalUpdatePromises = newLessons.map((lesson, index) =>
        supabase
          .from("course_lessons")
          .update({
            order_index: index,
            updated_at: new Date().toISOString(),
          })
          .eq("id", lesson.id)
      );

      const finalResults = await Promise.all(finalUpdatePromises);
      const failedFinalUpdate = finalResults.find((result) => result.error);

      if (failedFinalUpdate?.error) {
        logError("Error in final reordering phase", {
          error: failedFinalUpdate.error,
        });
        toast({
          title: "Error",
          description: "Failed to reorder lessons",
          variant: "destructive",
        });
        await mutate();
        return;
      }

      logInfo("Lessons reordered successfully", {
        activeId: active.id,
        overId: over.id,
        totalLessons: newLessons.length,
      });
    } catch (error) {
      logError("Exception reordering lessons", { error });
      // Revert the optimistic update
      await mutate();
    } finally {
      setIsReordering(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      {isReordering && (
        <div className="fixed top-4 right-4 z-50">
          <div className="flex items-center gap-2 rounded-lg bg-background border px-3 py-2 shadow-lg">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Saving order...</span>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between mb-4">
        <h5 className="text-sm font-medium text-muted-foreground">Lessons</h5>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-3 w-3" />
              Add Lesson
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingLesson ? "Edit Lesson" : "Create New Lesson"}
              </DialogTitle>
              <DialogDescription>
                {editingLesson
                  ? "Update the lesson details below"
                  : "Add a new lesson to this module"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="lesson-title">Lesson Title</Label>
                <Input
                  id="lesson-title"
                  placeholder="e.g., Arrays and Strings"
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lesson-subtitle">
                  Lesson Subtitle (Optional)
                </Label>
                <Textarea
                  id="lesson-subtitle"
                  placeholder="Brief description of the lesson content"
                  value={lessonSubtitle}
                  onChange={(e) => setLessonSubtitle(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button onClick={handleSaveLesson} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Lesson"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {lessons.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No lessons yet. Add your first lesson to this module.
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={lessons.map((l) => l.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {lessons.map((lesson) => (
                <SortableLesson
                  key={lesson.id}
                  lesson={lesson}
                  programId={programId}
                  handleOpenDialog={handleOpenDialog}
                  handleDeleteLesson={handleDeleteLesson}
                  isDragging={activeId === lesson.id}
                />
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeId ? (
              <div className="relative rounded-lg border-2 border-primary/20 bg-background shadow-lg p-3 opacity-90">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">
                      {lessons.find((l) => l.id === activeId)?.title}
                    </p>
                    {lessons.find((l) => l.id === activeId)?.subtitle && (
                      <p className="text-xs text-muted-foreground">
                        {lessons.find((l) => l.id === activeId)?.subtitle}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
