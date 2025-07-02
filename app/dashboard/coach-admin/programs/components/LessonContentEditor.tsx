"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MoreVertical,
  Trash2,
  GripVertical,
  Type,
  FileText,
  Image,
  Video,
  Loader2,
  Upload,
  Play,
  Check,
  X,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAxiomLogging } from "@/context/AxiomLoggingContext";
import type { Database } from "@/utils/supabase/database.types";
import MuxPlayer from "@mux/mux-player-react";
import { generateMuxUploadUrl } from "@/app/dashboard/jobs/[jobId]/mockInterviews/[mockInterviewId]/actions";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { cn } from "@/lib/utils";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Quote,
  Undo2,
  Redo2,
  Link2,
  Link2Off,
  Heading2,
  Pilcrow,
} from "lucide-react";
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

type ContentBlock = Database["public"]["Tables"]["course_lesson_blocks"]["Row"];
type ContentType = Database["public"]["Enums"]["course_content_type"];
type LessonFile = Database["public"]["Tables"]["course_lesson_files"]["Row"] & {
  course_lesson_files_mux_metadata?:
    | Database["public"]["Tables"]["course_lesson_files_mux_metadata"]["Row"]
    | null;
};

interface LessonContentEditorProps {
  lessonId: string;
  coachId: string;
  programId: string;
}

const contentTypeIcons: Record<ContentType, React.ReactNode> = {
  text: <Type className="h-4 w-4" />,
  pdf: <FileText className="h-4 w-4" />,
  image: <Image className="h-4 w-4" />,
  video: <Video className="h-4 w-4" />,
};

const contentTypeLabels: Record<ContentType, string> = {
  text: "Text",
  pdf: "PDF",
  image: "Image",
  video: "Video",
};

// Toolbar Button Component
const ToolbarButton = ({
  onClick,
  isActive = false,
  disabled = false,
  children,
  tooltip,
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  tooltip?: string;
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "p-1.5 rounded transition-colors",
        "hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed",
        isActive && "bg-muted text-foreground"
      )}
      title={tooltip}
    >
      {children}
    </button>
  );
};

// Rich Text Editor Component
const RichTextEditor = ({
  content,
  isEditing,
  onUpdate,
  onSave,
  onCancel,
  isSaving,
}: {
  content: string;
  isEditing: boolean;
  onUpdate: (content: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
}) => {
  const [linkUrl, setLinkUrl] = React.useState("");
  const [showLinkInput, setShowLinkInput] = React.useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Start typing...",
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline underline-offset-2",
        },
      }),
      Underline,
    ],
    content: content || "",
    editable: isEditing,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none min-h-[80px] px-4 py-3",
      },
    },
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML());
    },
  });

  React.useEffect(() => {
    if (editor) {
      editor.setEditable(isEditing);
    }
  }, [editor, isEditing]);

  const addLink = () => {
    if (linkUrl && editor) {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: linkUrl })
        .run();
      setLinkUrl("");
      setShowLinkInput(false);
    }
  };

  const removeLink = () => {
    if (editor) {
      editor.chain().focus().unsetLink().run();
    }
  };

  return (
    <div className="relative">
      {isEditing ? (
        <div className="space-y-3">
          <div className="relative rounded-lg border-2 border-primary/20 bg-background shadow-sm overflow-hidden">
            {editor && (
              <div className="border-b bg-muted/30 px-2 py-1.5">
                <div className="flex items-center gap-1 flex-wrap">
                  {/* Text formatting */}
                  <div className="flex items-center gap-0.5 mr-2">
                    <ToolbarButton
                      onClick={() => editor.chain().focus().toggleBold().run()}
                      isActive={editor.isActive("bold")}
                      tooltip="Bold (Cmd+B)"
                    >
                      <Bold className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton
                      onClick={() =>
                        editor.chain().focus().toggleItalic().run()
                      }
                      isActive={editor.isActive("italic")}
                      tooltip="Italic (Cmd+I)"
                    >
                      <Italic className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton
                      onClick={() =>
                        editor.chain().focus().toggleUnderline().run()
                      }
                      isActive={editor.isActive("underline")}
                      tooltip="Underline (Cmd+U)"
                    >
                      <UnderlineIcon className="h-4 w-4" />
                    </ToolbarButton>
                  </div>

                  {/* Paragraph/Heading */}
                  <div className="flex items-center gap-0.5 mr-2">
                    <ToolbarButton
                      onClick={() =>
                        editor.chain().focus().setParagraph().run()
                      }
                      isActive={editor.isActive("paragraph")}
                      tooltip="Paragraph"
                    >
                      <Pilcrow className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton
                      onClick={() =>
                        editor.chain().focus().toggleHeading({ level: 2 }).run()
                      }
                      isActive={editor.isActive("heading", { level: 2 })}
                      tooltip="Heading 2"
                    >
                      <Heading2 className="h-4 w-4" />
                    </ToolbarButton>
                  </div>

                  {/* Lists */}
                  <div className="flex items-center gap-0.5 mr-2">
                    <ToolbarButton
                      onClick={() =>
                        editor.chain().focus().toggleBulletList().run()
                      }
                      isActive={editor.isActive("bulletList")}
                      tooltip="Bullet List"
                    >
                      <List className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton
                      onClick={() =>
                        editor.chain().focus().toggleOrderedList().run()
                      }
                      isActive={editor.isActive("orderedList")}
                      tooltip="Numbered List"
                    >
                      <ListOrdered className="h-4 w-4" />
                    </ToolbarButton>
                  </div>

                  {/* Quote */}
                  <div className="flex items-center gap-0.5 mr-2">
                    <ToolbarButton
                      onClick={() =>
                        editor.chain().focus().toggleBlockquote().run()
                      }
                      isActive={editor.isActive("blockquote")}
                      tooltip="Quote"
                    >
                      <Quote className="h-4 w-4" />
                    </ToolbarButton>
                  </div>

                  {/* Link */}
                  <div className="flex items-center gap-0.5 mr-2">
                    {showLinkInput ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="url"
                          placeholder="Enter URL"
                          value={linkUrl}
                          onChange={(e) => setLinkUrl(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addLink();
                            } else if (e.key === "Escape") {
                              setShowLinkInput(false);
                              setLinkUrl("");
                            }
                          }}
                          className="h-6 w-32 rounded border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                          autoFocus
                        />
                        <ToolbarButton onClick={addLink} tooltip="Add Link">
                          <Check className="h-3 w-3" />
                        </ToolbarButton>
                        <ToolbarButton
                          onClick={() => {
                            setShowLinkInput(false);
                            setLinkUrl("");
                          }}
                          tooltip="Cancel"
                        >
                          <X className="h-3 w-3" />
                        </ToolbarButton>
                      </div>
                    ) : (
                      <>
                        <ToolbarButton
                          onClick={() => setShowLinkInput(true)}
                          isActive={editor.isActive("link")}
                          tooltip="Add Link"
                        >
                          <Link2 className="h-4 w-4" />
                        </ToolbarButton>
                        {editor.isActive("link") && (
                          <ToolbarButton
                            onClick={removeLink}
                            tooltip="Remove Link"
                          >
                            <Link2Off className="h-4 w-4" />
                          </ToolbarButton>
                        )}
                      </>
                    )}
                  </div>

                  {/* Undo/Redo */}
                  <div className="flex items-center gap-0.5">
                    <ToolbarButton
                      onClick={() => editor.chain().focus().undo().run()}
                      disabled={!editor.can().undo()}
                      tooltip="Undo (Cmd+Z)"
                    >
                      <Undo2 className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton
                      onClick={() => editor.chain().focus().redo().run()}
                      disabled={!editor.can().redo()}
                      tooltip="Redo (Cmd+Shift+Z)"
                    >
                      <Redo2 className="h-4 w-4" />
                    </ToolbarButton>
                  </div>
                </div>
              </div>
            )}
            <EditorContent editor={editor} />
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={onSave}
              disabled={isSaving}
              className="h-8"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                  Saving
                </>
              ) : (
                <>
                  <Check className="mr-1.5 h-3 w-3" />
                  Save
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onCancel}
              className="h-8"
            >
              <X className="mr-1.5 h-3 w-3" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div
          className="group relative rounded-lg border border-border/50 bg-card/50 transition-all hover:border-border hover:bg-card hover:shadow-sm cursor-pointer"
          onClick={() => onUpdate("")}
        >
          <div className="p-4">
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{
                __html:
                  content ||
                  '<p class="text-muted-foreground">Click to add content...</p>',
              }}
            />
          </div>
          <div className="absolute inset-0 rounded-lg bg-foreground/5 opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none" />
          <div className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
            <span className="text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded-md shadow-sm">
              Click to edit
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// Sortable Block Component
const SortableBlock = ({
  block,
  children,
  isDragging,
}: {
  block: ContentBlock;
  children: React.ReactNode;
  isDragging: boolean;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("group relative transition-all", isDragging && "z-50")}
    >
      <div
        className={cn(
          "absolute -left-10 top-4 flex h-8 w-8 items-center justify-center rounded-md transition-all drag-handle",
          "opacity-0 group-hover:opacity-100",
          "hover:bg-muted/80 cursor-grab active:cursor-grabbing",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          isDragging && "opacity-100 cursor-grabbing"
        )}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className={cn("transition-opacity", isDragging && "opacity-30")}>
        {children}
      </div>
    </div>
  );
};

export default function LessonContentEditor({
  lessonId,
  coachId,
  programId,
}: LessonContentEditorProps) {
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [files, setFiles] = useState<LessonFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [uploadingVideoBlockId, setUploadingVideoBlockId] = useState<
    string | null
  >(null);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [fileUrls, setFileUrls] = useState<Record<string, string>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const { toast } = useToast();
  const { logInfo, logError } = useAxiomLogging();

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

  useEffect(() => {
    fetchContent();
  }, [lessonId]);

  const fetchContent = async () => {
    try {
      const supabase = createSupabaseBrowserClient();

      // Fetch blocks
      const { data: blocksData, error: blocksError } = await supabase
        .from("course_lesson_blocks")
        .select("*")
        .eq("lesson_id", lessonId)
        .eq("deletion_status", "not_deleted")
        .order("order_index", { ascending: true });

      if (blocksError) {
        logError("Error fetching blocks", {
          error: blocksError,
          lessonId,
          errorCode: blocksError.code,
          errorMessage: blocksError.message,
        });
        toast({
          title: "Error",
          description: "Sorry, something went wrong. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Fetch files with Mux metadata
      const { data: filesData, error: filesError } = await supabase
        .from("course_lesson_files")
        .select(
          `
          *,
          course_lesson_files_mux_metadata (*)
        `
        )
        .eq("lesson_id", lessonId);

      if (filesError) {
        logError("Error fetching files", { error: filesError, lessonId });
      }

      setBlocks(blocksData || []);
      setFiles(filesData || []);

      // Generate signed URLs for files
      if (filesData && filesData.length > 0) {
        const urls: Record<string, string> = {};
        for (const file of filesData) {
          if (file.file_path && file.bucket_name) {
            const { data, error } = await supabase.storage
              .from(file.bucket_name)
              .createSignedUrl(file.file_path, 3600); // 1 hour expiry

            if (data && !error) {
              urls[file.id] = data.signedUrl;
            }
          }
        }
        setFileUrls(urls);
      }
    } catch (error) {
      logError("Exception fetching content", { error, lessonId });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBlock = async (type: ContentType) => {
    try {
      const supabase = createSupabaseBrowserClient();

      // Find the highest order_index and add 1
      const maxOrderIndex =
        blocks.length > 0
          ? Math.max(...blocks.map((block) => block.order_index))
          : -1;
      const newOrderIndex = maxOrderIndex + 1;

      // Create appropriate default content based on type
      const blockData: any = {
        lesson_id: lessonId,
        block_type: type,
        order_index: newOrderIndex,
      };

      if (type === "text") {
        blockData.text_content = "";
      }

      const { data: newBlock, error } = await supabase
        .from("course_lesson_blocks")
        .insert(blockData)
        .select()
        .single();

      if (error) {
        logError("Error creating block", { error, lessonId, type });
        toast({
          title: "Error",
          description: error.message || "Failed to add content block",
          variant: "destructive",
        });
        return;
      }

      // Don't create placeholder file for video blocks anymore
      // Files will be created when actually uploaded

      logInfo("Block created successfully", { lessonId, type, newOrderIndex });
      await fetchContent();
    } catch (error) {
      logError("Exception creating block", { error, lessonId });
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleUpdateTextBlock = async (blockId: string, content: string) => {
    setIsSaving(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase
        .from("course_lesson_blocks")
        .update({
          text_content: content,
          updated_at: new Date().toISOString(),
        })
        .eq("id", blockId);

      if (error) {
        logError("Error updating text block", { error, blockId });
        toast({
          title: "Error",
          description: "Failed to update text content",
          variant: "destructive",
        });
        return;
      }

      logInfo("Text block updated successfully", { blockId });
      await fetchContent();
    } catch (error) {
      logError("Exception updating text block", { error, blockId });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase
        .from("course_lesson_blocks")
        .update({
          deletion_status: "deleted",
          updated_at: new Date().toISOString(),
        })
        .eq("id", blockId);

      if (error) {
        logError("Error deleting block", { error, blockId });
        toast({
          title: "Error",
          description: "Failed to delete content block",
          variant: "destructive",
        });
        return;
      }

      logInfo("Block deleted successfully", { blockId });
      toast({
        title: "Success",
        description: "Content block deleted",
      });
      await fetchContent();
    } catch (error) {
      logError("Exception deleting block", { error, blockId });
    }
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

    const oldIndex = blocks.findIndex((block) => block.id === active.id);
    const newIndex = blocks.findIndex((block) => block.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Optimistically update the UI
    const newBlocks = arrayMove(blocks, oldIndex, newIndex);
    setBlocks(newBlocks);
    setIsReordering(true);

    try {
      const supabase = createSupabaseBrowserClient();

      // To avoid unique constraint violations, we need to update blocks in two phases:
      // 1. First, set all blocks to temporary high order_index values
      // 2. Then set them to their final positions

      const tempOffset = 10000; // High offset to avoid conflicts

      // Phase 1: Move all blocks to temporary positions
      const tempUpdatePromises = newBlocks.map((block, index) =>
        supabase
          .from("course_lesson_blocks")
          .update({
            order_index: tempOffset + index,
            updated_at: new Date().toISOString(),
          })
          .eq("id", block.id)
      );

      const tempResults = await Promise.all(tempUpdatePromises);
      const failedTempUpdate = tempResults.find((result) => result.error);

      if (failedTempUpdate?.error) {
        logError("Error in temp reordering phase", {
          error: failedTempUpdate.error,
        });
        toast({
          title: "Error",
          description: "Failed to reorder blocks",
          variant: "destructive",
        });
        await fetchContent();
        return;
      }

      // Phase 2: Move blocks to their final positions
      const finalUpdatePromises = newBlocks.map((block, index) =>
        supabase
          .from("course_lesson_blocks")
          .update({
            order_index: index,
            updated_at: new Date().toISOString(),
          })
          .eq("id", block.id)
      );

      const finalResults = await Promise.all(finalUpdatePromises);
      const failedFinalUpdate = finalResults.find((result) => result.error);

      if (failedFinalUpdate?.error) {
        logError("Error in final reordering phase", {
          error: failedFinalUpdate.error,
        });
        toast({
          title: "Error",
          description: "Failed to reorder blocks",
          variant: "destructive",
        });
        await fetchContent();
        return;
      }

      logInfo("Blocks reordered successfully", {
        activeId: active.id,
        overId: over.id,
        totalBlocks: newBlocks.length,
      });
    } catch (error) {
      logError("Exception reordering blocks", { error });
      // Revert the optimistic update
      await fetchContent();
    } finally {
      setIsReordering(false);
    }
  };

  const handleVideoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    blockId: string
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast({
        title: "Error",
        description: "Please select a video file",
        variant: "destructive",
      });
      return;
    }

    setUploadingVideoBlockId(blockId);
    setVideoUploadProgress(0);

    try {
      const supabase = createSupabaseBrowserClient();

      // First, create a file record
      const fileExt = file.name.split(".").pop();
      const fileId = crypto.randomUUID();
      const fileName = `${coachId}/${lessonId}/${fileId}.${fileExt}`;

      // Create file record
      const { data: fileRecord, error: fileError } = await supabase
        .from("course_lesson_files")
        .insert({
          lesson_id: lessonId,
          coach_id: coachId,
          display_name: file.name,
          file_path: fileName,
          mime_type: file.type,
          bucket_name: "course-files",
        })
        .select()
        .single();

      if (fileError) {
        logError("Error creating file record", { error: fileError });
        toast({
          title: "Error",
          description: "Failed to create file record",
          variant: "destructive",
        });
        setUploadingVideoBlockId(null);
        setVideoUploadProgress(0);
        return;
      }

      // Update block with file reference
      const { error: blockUpdateError } = await supabase
        .from("course_lesson_blocks")
        .update({ file_id: fileRecord.id })
        .eq("id", blockId);

      if (blockUpdateError) {
        logError("Error updating block with file", { error: blockUpdateError });
      }

      // Upload to Supabase Storage
      logInfo("Uploading video to Supabase Storage", {
        fileName,
        fileSize: file.size,
      });

      const { error: uploadError } = await supabase.storage
        .from("course-files")
        .upload(fileName, file, {
          upsert: true,
        });

      if (uploadError) {
        logError("Error uploading to Supabase Storage", { error: uploadError });
        toast({
          title: "Error",
          description: "Failed to upload video file",
          variant: "destructive",
        });
        setUploadingVideoBlockId(null);
        setVideoUploadProgress(0);
        return;
      }

      // Generate Mux upload URL
      const { uploadUrl, error } = await generateMuxUploadUrl({
        databaseId: fileRecord.id,
        table: "course_lesson_files_mux_metadata",
      });

      if (error || !uploadUrl) {
        logError("Error generating Mux upload URL", { error, blockId });
        // Don't fail completely - video is still in Supabase Storage
        toast({
          title: "Partial Success",
          description:
            "Video uploaded to storage, but Mux processing unavailable",
          variant: "default",
        });
        setUploadingVideoBlockId(null);
        setVideoUploadProgress(0);
        await fetchContent();
        return;
      }

      // Upload video to Mux with progress tracking
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          setVideoUploadProgress(Math.round(percentComplete));
        }
      });

      xhr.addEventListener("load", async () => {
        if (xhr.status === 200 || xhr.status === 201) {
          logInfo("Video uploaded successfully", { blockId });

          // The Mux webhook will handle updating the metadata with asset details
          toast({
            title: "Success",
            description: "Video uploaded! Processing may take a few moments.",
          });

          // Reset upload state
          setUploadingVideoBlockId(null);
          setVideoUploadProgress(0);

          // Refresh content to show processing state
          await fetchContent();
        } else {
          throw new Error(`Upload failed with status ${xhr.status}`);
        }
      });

      xhr.addEventListener("error", () => {
        logError("Video upload to Mux failed", { blockId });
        toast({
          title: "Partial Success",
          description: "Video saved to storage, but Mux upload failed",
          variant: "default",
        });
        setUploadingVideoBlockId(null);
        setVideoUploadProgress(0);
        fetchContent();
      });

      xhr.open("PUT", uploadUrl);
      xhr.send(file);
    } catch (error) {
      logError("Exception uploading video", { error, blockId });
      toast({
        title: "Error",
        description: "An error occurred during video upload",
        variant: "destructive",
      });
      setUploadingVideoBlockId(null);
      setVideoUploadProgress(0);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    blockId: string
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const supabase = createSupabaseBrowserClient();

      // Get the block to determine its type
      const block = blocks.find((b) => b.id === blockId);
      if (!block) {
        toast({
          title: "Error",
          description: "Block not found",
          variant: "destructive",
        });
        return;
      }

      // Upload file to storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${coachId}/${lessonId}/${blockId}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("course-files")
        .upload(fileName, file, {
          upsert: true,
        });

      if (uploadError) {
        logError("Error uploading file", { error: uploadError, fileName });
        toast({
          title: "Error",
          description: "Failed to upload file",
          variant: "destructive",
        });
        return;
      }

      // Create file record
      const { data: fileRecord, error: fileError } = await supabase
        .from("course_lesson_files")
        .insert({
          lesson_id: lessonId,
          coach_id: coachId,
          display_name: file.name,
          file_path: fileName,
          mime_type: file.type,
        })
        .select()
        .single();

      if (fileError) {
        logError("Error creating file record", { error: fileError });
        toast({
          title: "Error",
          description: "Failed to save file information",
          variant: "destructive",
        });
        return;
      }

      // Update block with file reference
      const { error: updateError } = await supabase
        .from("course_lesson_blocks")
        .update({
          file_id: fileRecord.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", blockId);

      if (updateError) {
        logError("Error updating block with file", {
          error: updateError,
          blockId,
        });
        toast({
          title: "Error",
          description: "Failed to link file to content block",
          variant: "destructive",
        });
        return;
      }

      logInfo("File uploaded successfully", { fileId: fileRecord.id, blockId });
      toast({
        title: "Success",
        description: "File uploaded successfully",
      });
      await fetchContent();
    } catch (error) {
      logError("Exception uploading file", { error, blockId });
    }
  };

  const renderTextBlock = (block: ContentBlock) => {
    return (
      <RichTextEditor
        content={block.text_content || ""}
        isEditing={editingBlockId === block.id}
        onUpdate={(content) => {
          if (content === "" && editingBlockId !== block.id) {
            // This is a click on the read-only view to enter edit mode
            setEditingBlockId(block.id);
            setEditingContent(block.text_content || "");
          } else if (editingBlockId === block.id) {
            // This is an actual content update while editing
            setEditingContent(content);
          }
        }}
        onSave={() => {
          handleUpdateTextBlock(block.id, editingContent);
          setEditingBlockId(null);
        }}
        onCancel={() => {
          setEditingBlockId(null);
          setEditingContent("");
        }}
        isSaving={isSaving}
      />
    );
  };

  const renderBlock = (block: ContentBlock) => {
    switch (block.block_type) {
      case "text":
        return renderTextBlock(block);

      case "pdf":
      case "image":
        const file = files.find((f) => f.id === block.file_id);
        return (
          <div className="space-y-2">
            {file ? (
              <div className="space-y-3">
                {block.block_type === "image" && fileUrls[file.id] ? (
                  <div className="relative overflow-hidden rounded-lg border border-border/50 bg-card/50">
                    <img
                      src={fileUrls[file.id]}
                      alt={file.display_name}
                      className="w-full h-auto"
                    />
                  </div>
                ) : block.block_type === "pdf" && fileUrls[file.id] ? (
                  <div className="relative overflow-hidden rounded-lg border border-border/50 bg-muted/10">
                    <iframe
                      src={fileUrls[file.id]}
                      className="w-full h-[600px]"
                      title={file.display_name}
                    />
                  </div>
                ) : null}
                <div className="flex items-center justify-between rounded-lg border border-border/50 bg-card/50 px-3 py-2">
                  <p className="text-sm font-medium truncate">
                    {file.display_name}
                  </p>
                  <span className="text-xs text-muted-foreground rounded-md bg-muted px-2 py-1">
                    {contentTypeLabels[block.block_type]}
                  </span>
                </div>
              </div>
            ) : (
              <div className="group relative rounded-lg border-2 border-dashed border-border/50 bg-card/30 transition-all hover:border-border hover:bg-card/50">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept={block.block_type === "pdf" ? ".pdf" : "image/*"}
                    onChange={(e) => handleFileUpload(e, block.id)}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center justify-center px-6 py-8">
                    <div className="rounded-full bg-muted p-3 mb-3 group-hover:bg-muted/80 transition-colors">
                      <Upload className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      Upload {contentTypeLabels[block.block_type]}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {block.block_type === "pdf"
                        ? "PDF files only"
                        : "JPG, PNG, GIF, WebP"}
                    </p>
                  </div>
                </label>
              </div>
            )}
          </div>
        );

      case "video":
        const videoFile = files.find((f) => f.id === block.file_id);

        if (uploadingVideoBlockId === block.id) {
          return (
            <div className="rounded-lg border border-border/50 bg-card/50 p-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <p className="text-sm font-medium">Uploading video...</p>
                </div>
                <div className="relative">
                  <div className="w-full bg-secondary/30 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${videoUploadProgress}%` }}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  {videoUploadProgress}% complete
                </p>
              </div>
            </div>
          );
        }

        if (videoFile) {
          const muxMeta = videoFile.course_lesson_files_mux_metadata;

          if (muxMeta?.playback_id && muxMeta.status !== "errored") {
            return (
              <div className="space-y-3">
                <div className="relative overflow-hidden rounded-lg border border-border/50 bg-black">
                  <MuxPlayer
                    streamType="on-demand"
                    playbackId={muxMeta.playback_id}
                    metadata={{
                      video_id: videoFile.id,
                      video_title: videoFile.display_name || `Lesson Video`,
                    }}
                    className="w-full"
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border/50 bg-card/50 px-3 py-2">
                  <p className="text-sm font-medium truncate">
                    {videoFile.display_name}
                  </p>
                  <span className="text-xs text-muted-foreground rounded-md bg-muted px-2 py-1">
                    {contentTypeLabels.video}
                  </span>
                </div>
              </div>
            );
          }

          if (muxMeta?.status === "preparing") {
            return (
              <div className="rounded-lg border border-border/50 bg-card/50 p-6">
                <div className="flex items-center justify-center gap-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Video className="h-4 w-4 text-primary animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Processing video...</p>
                    <p className="text-xs text-muted-foreground">
                      This may take a few moments
                    </p>
                  </div>
                </div>
              </div>
            );
          }

          if (videoFile.file_path && fileUrls[videoFile.id]) {
            return (
              <div className="space-y-3">
                <div className="relative overflow-hidden rounded-lg border border-border/50 bg-black">
                  <video
                    controls
                    className="w-full"
                    src={fileUrls[videoFile.id]}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border/50 bg-card/50 px-3 py-2">
                  <p className="text-sm font-medium truncate">
                    {videoFile.display_name}
                  </p>
                  <div className="flex items-center gap-2">
                    {muxMeta?.status === "errored" && (
                      <span className="text-xs text-amber-600">
                        Fallback player
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground rounded-md bg-muted px-2 py-1">
                      {contentTypeLabels.video}
                    </span>
                  </div>
                </div>
              </div>
            );
          }
        }

        return (
          <div className="group relative rounded-lg border-2 border-dashed border-border/50 bg-card/30 transition-all hover:border-border hover:bg-card/50">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="video/*"
                onChange={(e) => handleVideoUpload(e, block.id)}
                className="hidden"
              />
              <div className="flex flex-col items-center justify-center px-6 py-8">
                <div className="rounded-full bg-muted p-3 mb-3 group-hover:bg-muted/80 transition-colors">
                  <Video className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  Upload Video
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  MP4, MOV, AVI, WebM
                </p>
              </div>
            </label>
          </div>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Lesson Content
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Build your lesson with different content blocks
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Content
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => handleAddBlock("text")}>
              <Type className="mr-2 h-4 w-4" />
              Text Block
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAddBlock("pdf")}>
              <FileText className="mr-2 h-4 w-4" />
              PDF Document
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAddBlock("image")}>
              <Image className="mr-2 h-4 w-4" />
              Image
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAddBlock("video")}>
              <Video className="mr-2 h-4 w-4" />
              Video
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {isReordering && (
        <div className="fixed top-4 right-4 z-50">
          <div className="flex items-center gap-2 rounded-lg bg-background border px-3 py-2 shadow-lg">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Saving order...</span>
          </div>
        </div>
      )}
      {blocks.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/50 bg-card/30 px-6 py-12 text-center">
          <div className="mx-auto max-w-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Type className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="font-medium">No content yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Get started by adding your first content block using the button
              above.
            </p>
          </div>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={blocks.map((b) => b.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {blocks.map((block) => (
                <SortableBlock
                  key={block.id}
                  block={block}
                  isDragging={activeId === block.id}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted/50">
                          {contentTypeIcons[block.block_type]}
                        </div>
                        <span className="text-sm font-medium">
                          {contentTypeLabels[block.block_type]}
                        </span>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleDeleteBlock(block.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {renderBlock(block)}
                  </div>
                </SortableBlock>
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeId ? (
              <div className="relative rounded-lg border-2 border-primary/20 bg-background shadow-lg p-4 opacity-90">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted/50">
                    {
                      contentTypeIcons[
                        blocks.find((b) => b.id === activeId)?.block_type ||
                          "text"
                      ]
                    }
                  </div>
                  <span className="text-sm font-medium">
                    {
                      contentTypeLabels[
                        blocks.find((b) => b.id === activeId)?.block_type ||
                          "text"
                      ]
                    }
                  </span>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
