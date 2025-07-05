"use client";

import React, { useState, useEffect } from "react";
import useSWR from "swr";
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
  GripVertical,
  BookOpen,
  ChevronRight,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import type { Database } from "@/utils/supabase/database.types";
import CourseLessonManager from "./CourseLessonManager";
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

type CourseModule = Database["public"]["Tables"]["course_modules"]["Row"] & {
  published?: boolean;
};

interface CourseModuleManagerProps {
  courseId: string;
  coachId: string;
}

// Sortable Module Component
const SortableModule = ({
  module,
  expandedModules,
  toggleModuleExpansion,
  handleOpenDialog,
  handleDeleteModule,
  handleTogglePublish,
  isDragging,
  coachId,
}: {
  module: CourseModule;
  expandedModules: Set<string>;
  toggleModuleExpansion: (id: string) => void;
  handleOpenDialog: (module?: CourseModule) => void;
  handleDeleteModule: (id: string) => void;
  handleTogglePublish: (moduleId: string, published: boolean) => void;
  isDragging: boolean;
  coachId: string;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: module.id });

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
          "border rounded-lg overflow-hidden transition-opacity",
          isDragging && "opacity-30"
        )}
      >
        <div className="flex items-center justify-between p-4 bg-muted/50">
          <div className="flex items-center gap-3 flex-1">
            <div
              className="cursor-grab active:cursor-grabbing"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">{module.title}</h4>
                <Badge
                  variant={module.published ? "default" : "secondary"}
                  className="text-xs"
                >
                  {module.published ? "Published" : "Draft"}
                </Badge>
              </div>
              {module.subtitle && (
                <p className="text-sm text-muted-foreground">
                  {module.subtitle}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleModuleExpansion(module.id)}
            >
              <ChevronRight
                className={`h-4 w-4 transition-transform ${
                  expandedModules.has(module.id) ? "rotate-90" : ""
                }`}
              />
            </Button>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() =>
                  handleTogglePublish(module.id, !module.published)
                }
              >
                {module.published ? (
                  <>
                    <EyeOff className="mr-2 h-4 w-4" />
                    Unpublish Module
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    Publish Module
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleOpenDialog(module)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Module
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDeleteModule(module.id)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Module
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {expandedModules.has(module.id) && (
          <div className="p-4 border-t">
            <CourseLessonManager moduleId={module.id} coachId={coachId} />
          </div>
        )}
      </div>
    </div>
  );
};

// Fetcher function for SWR
const fetchModules = async (_key: string, courseId: string) => {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("course_modules")
    .select("*")
    .eq("course_id", courseId)
    .order("order_index", { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
};

export default function CourseModuleManager({
  courseId,
  coachId,
}: CourseModuleManagerProps) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set()
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<CourseModule | null>(null);
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleSubtitle, setModuleSubtitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const { toast } = useToast();
  const { logInfo, logError } = useAxiomLogging();

  // Use SWR for data fetching
  const {
    data: modules = [],
    error,
    isLoading,
    mutate,
  } = useSWR(
    [`/course-modules/${courseId}`, courseId],
    ([key, id]) => fetchModules(key, id),
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
      logError("Error fetching modules", { error, courseId });
      toast({
        title: "Error",
        description: "Failed to load modules",
        variant: "destructive",
      });
    }
  }, [error, courseId, logError, toast]);

  // Expand all modules by default when they're loaded or new ones are added
  useEffect(() => {
    if (modules.length > 0) {
      setExpandedModules((prev) => {
        const newSet = new Set(prev);
        modules.forEach((module) => {
          newSet.add(module.id);
        });
        return newSet;
      });
    }
  }, [modules]);

  const handleSaveModule = async () => {
    if (!moduleTitle.trim()) {
      toast({
        title: "Error",
        description: "Please enter a module title",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const supabase = createSupabaseBrowserClient();

      if (editingModule) {
        const { error } = await supabase
          .from("course_modules")
          .update({
            title: moduleTitle.trim(),
            subtitle: moduleSubtitle.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingModule.id);

        if (error) {
          logError("Error updating module", {
            error,
            moduleId: editingModule.id,
          });
          toast({
            title: "Error",
            description: "Failed to update module",
            variant: "destructive",
          });
          return;
        }

        logInfo("Module updated successfully", { moduleId: editingModule.id });
        toast({
          title: "Success",
          description: "Module updated successfully",
        });
      } else {
        const newOrderIndex = modules.length;
        const { error } = await supabase.from("course_modules").insert({
          course_id: courseId,
          title: moduleTitle.trim(),
          subtitle: moduleSubtitle.trim() || null,
          order_index: newOrderIndex,
          published: false, // New modules start as draft
        });

        if (error) {
          logError("Error creating module", { error, courseId });
          toast({
            title: "Error",
            description: "Failed to create module",
            variant: "destructive",
          });
          return;
        }

        logInfo("Module created successfully", { courseId });
        toast({
          title: "Success",
          description: "Module created successfully",
        });
      }

      await mutate();
      handleCloseDialog();
    } catch (error) {
      logError("Exception saving module", { error, courseId });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase
        .from("course_modules")
        .delete()
        .eq("id", moduleId);

      if (error) {
        logError("Error deleting module", { error, moduleId });
        toast({
          title: "Error",
          description: "Failed to delete module",
          variant: "destructive",
        });
        return;
      }

      logInfo("Module deleted successfully", { moduleId });
      toast({
        title: "Success",
        description: "Module deleted successfully",
      });
      await mutate();
    } catch (error) {
      logError("Exception deleting module", { error, moduleId });
    }
  };

  const handleTogglePublish = async (moduleId: string, published: boolean) => {
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase
        .from("course_modules")
        .update({ published })
        .eq("id", moduleId);

      if (error) {
        logError("Error updating module publish status", {
          error,
          moduleId,
          published,
        });
        toast({
          title: "Error",
          description: "Failed to update module status",
          variant: "destructive",
        });
        return;
      }

      logInfo("Module publish status updated", { moduleId, published });
      toast({
        title: "Success",
        description: published ? "Module published" : "Module unpublished",
      });
      await mutate();
    } catch (error) {
      logError("Exception updating module publish status", {
        error,
        moduleId,
        published,
      });
    }
  };

  const handleOpenDialog = (module?: CourseModule) => {
    if (module) {
      setEditingModule(module);
      setModuleTitle(module.title);
      setModuleSubtitle(module.subtitle || "");
    } else {
      setEditingModule(null);
      setModuleTitle("");
      setModuleSubtitle("");
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingModule(null);
    setModuleTitle("");
    setModuleSubtitle("");
  };

  const toggleModuleExpansion = (moduleId: string) => {
    setExpandedModules((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
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

    const oldIndex = modules.findIndex((module) => module.id === active.id);
    const newIndex = modules.findIndex((module) => module.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Optimistically update the UI
    const newModules = arrayMove(modules, oldIndex, newIndex);
    mutate(newModules, false); // Update local data without revalidation
    setIsReordering(true);

    try {
      const supabase = createSupabaseBrowserClient();

      // To avoid unique constraint violations, we need to update modules in two phases:
      // 1. First, set all modules to temporary high order_index values
      // 2. Then set them to their final positions

      const tempOffset = 10000; // High offset to avoid conflicts

      // Phase 1: Move all modules to temporary positions
      const tempUpdatePromises = newModules.map((module, index) =>
        supabase
          .from("course_modules")
          .update({
            order_index: tempOffset + index,
            updated_at: new Date().toISOString(),
          })
          .eq("id", module.id)
      );

      const tempResults = await Promise.all(tempUpdatePromises);
      const failedTempUpdate = tempResults.find((result) => result.error);

      if (failedTempUpdate?.error) {
        logError("Error in temp reordering phase", {
          error: failedTempUpdate.error,
        });
        toast({
          title: "Error",
          description: "Failed to reorder modules",
          variant: "destructive",
        });
        await mutate();
        return;
      }

      // Phase 2: Move modules to their final positions
      const finalUpdatePromises = newModules.map((module, index) =>
        supabase
          .from("course_modules")
          .update({
            order_index: index,
            updated_at: new Date().toISOString(),
          })
          .eq("id", module.id)
      );

      const finalResults = await Promise.all(finalUpdatePromises);
      const failedFinalUpdate = finalResults.find((result) => result.error);

      if (failedFinalUpdate?.error) {
        logError("Error in final reordering phase", {
          error: failedFinalUpdate.error,
        });
        toast({
          title: "Error",
          description: "Failed to reorder modules",
          variant: "destructive",
        });
        await mutate();
        return;
      }

      logInfo("Modules reordered successfully", {
        activeId: active.id,
        overId: over.id,
        totalModules: newModules.length,
      });
    } catch (error) {
      logError("Exception reordering modules", { error });
      // Revert the optimistic update by refetching data
      await mutate();
    } finally {
      setIsReordering(false);
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Course Modules
            </CardTitle>
            <CardDescription>
              Organize your course content into modules and lessons
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Module
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingModule ? "Edit Module" : "Create New Module"}
                </DialogTitle>
                <DialogDescription>
                  {editingModule
                    ? "Update the module details below"
                    : "Add a new module to your course"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="module-title">Module Title</Label>
                  <Input
                    id="module-title"
                    placeholder="e.g., Introduction to Data Structures"
                    value={moduleTitle}
                    onChange={(e) => setModuleTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="module-subtitle">
                    Module Subtitle (Optional)
                  </Label>
                  <Textarea
                    id="module-subtitle"
                    placeholder="Brief description of the module content"
                    value={moduleSubtitle}
                    onChange={(e) => setModuleSubtitle(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button onClick={handleSaveModule} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Module"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isReordering && (
          <div className="fixed top-4 right-4 z-50">
            <div className="flex items-center gap-2 rounded-lg bg-background border px-3 py-2 shadow-lg">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Saving order...</span>
            </div>
          </div>
        )}
        {modules.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              No modules created yet. Add your first module to get started.
            </p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Module
            </Button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={modules.map((m) => m.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {modules.map((module) => (
                  <SortableModule
                    key={module.id}
                    module={module}
                    expandedModules={expandedModules}
                    toggleModuleExpansion={toggleModuleExpansion}
                    handleOpenDialog={handleOpenDialog}
                    handleDeleteModule={handleDeleteModule}
                    handleTogglePublish={handleTogglePublish}
                    isDragging={activeId === module.id}
                    coachId={coachId}
                  />
                ))}
              </div>
            </SortableContext>
            <DragOverlay>
              {activeId ? (
                <div className="relative rounded-lg border-2 border-primary/20 bg-background shadow-lg p-4 opacity-90">
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <h4 className="font-medium">
                        {modules.find((m) => m.id === activeId)?.title}
                      </h4>
                      {modules.find((m) => m.id === activeId)?.subtitle && (
                        <p className="text-sm text-muted-foreground">
                          {modules.find((m) => m.id === activeId)?.subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </CardContent>
    </Card>
  );
}
