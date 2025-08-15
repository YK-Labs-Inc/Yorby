"use client";

import React from "react";
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
  Check,
  X,
} from "lucide-react";

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  tooltip?: string;
  children: React.ReactNode;
}

const ToolbarButton = ({
  onClick,
  isActive = false,
  disabled = false,
  tooltip,
  children,
}: ToolbarButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-md p-1.5 text-sm transition-colors disabled:opacity-50",
        isActive
          ? "bg-primary/10 text-primary"
          : "hover:bg-muted text-muted-foreground hover:text-foreground"
      )}
      title={tooltip}
    >
      {children}
    </button>
  );
};

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  className?: string;
  readOnly?: boolean;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Start typing...",
  minHeight = "200px",
  className,
  readOnly = false,
}: RichTextEditorProps) {
  const [linkUrl, setLinkUrl] = React.useState("");
  const [showLinkInput, setShowLinkInput] = React.useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline underline-offset-2",
        },
      }),
      Underline,
    ],
    content: value || "",
    editable: !readOnly,
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm max-w-none focus:outline-none px-4 py-3",
          `min-h-[${minHeight}]`
        ),
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  React.useEffect(() => {
    if (editor && editor.getHTML() !== value) {
      editor.commands.setContent(value || "");
    }
  }, [value]);

  React.useEffect(() => {
    if (editor) {
      editor.setEditable(!readOnly);
    }
  }, [editor, readOnly]);

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

  if (!editor) {
    return null;
  }

  if (readOnly) {
    return (
      <div className={cn("rounded-lg border bg-muted/20", className)}>
        <div
          className="prose prose-sm max-w-none px-4 py-3"
          dangerouslySetInnerHTML={{ __html: value || "<p>No content</p>" }}
          style={{ minHeight }}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border bg-background shadow-sm overflow-hidden",
        className
      )}
    >
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
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive("italic")}
              tooltip="Italic (Cmd+I)"
            >
              <Italic className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              isActive={editor.isActive("underline")}
              tooltip="Underline (Cmd+U)"
            >
              <UnderlineIcon className="h-4 w-4" />
            </ToolbarButton>
          </div>

          {/* Paragraph/Heading */}
          <div className="flex items-center gap-0.5 mr-2">
            <ToolbarButton
              onClick={() => editor.chain().focus().setParagraph().run()}
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
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={editor.isActive("bulletList")}
              tooltip="Bullet List"
            >
              <List className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={editor.isActive("orderedList")}
              tooltip="Numbered List"
            >
              <ListOrdered className="h-4 w-4" />
            </ToolbarButton>
          </div>

          {/* Quote */}
          <div className="flex items-center gap-0.5 mr-2">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
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
                  <ToolbarButton onClick={removeLink} tooltip="Remove Link">
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
      <EditorContent editor={editor} style={{ minHeight }} />
    </div>
  );
}
