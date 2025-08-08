"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface CodeEditorProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  minHeight?: string;
  maxHeight?: string;
}

export function CodeEditor({
  id,
  name,
  value,
  onChange,
  placeholder,
  className,
  disabled = false,
  minHeight = "200px",
  maxHeight,
}: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const [lineCount, setLineCount] = useState(1);

  // Update line count when value changes
  useEffect(() => {
    const lines = value.split("\n").length;
    setLineCount(lines);
  }, [value]);

  // Sync scroll between textarea and line numbers
  const handleScroll = useCallback(() => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  // Handle tab key press
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      // Tab key handling
      if (e.key === "Tab") {
        e.preventDefault();
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const spaces = "  "; // 2 spaces for tab

        if (start === end) {
          // No selection, insert spaces at cursor
          const newValue =
            value.substring(0, start) + spaces + value.substring(end);
          onChange(newValue);
          
          // Restore cursor position after React re-render
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start + spaces.length;
          }, 0);
        } else {
          // Has selection, indent all selected lines
          const lines = value.split("\n");
          let currentPos = 0;
          let startLine = 0;
          let endLine = 0;
          
          // Find start and end lines
          for (let i = 0; i < lines.length; i++) {
            const lineLength = lines[i].length + 1; // +1 for newline
            if (currentPos <= start && start < currentPos + lineLength) {
              startLine = i;
            }
            if (currentPos < end && end <= currentPos + lineLength) {
              endLine = i;
              break;
            }
            currentPos += lineLength;
          }

          // Indent or outdent based on shift key
          if (e.shiftKey) {
            // Outdent
            for (let i = startLine; i <= endLine; i++) {
              if (lines[i].startsWith(spaces)) {
                lines[i] = lines[i].substring(spaces.length);
              }
            }
          } else {
            // Indent
            for (let i = startLine; i <= endLine; i++) {
              lines[i] = spaces + lines[i];
            }
          }

          const newValue = lines.join("\n");
          onChange(newValue);
        }
      }

      // Cmd/Ctrl + [ for outdent
      if ((e.metaKey || e.ctrlKey) && e.key === "[") {
        e.preventDefault();
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const lines = value.split("\n");
        let currentPos = 0;
        let startLine = 0;
        let endLine = 0;
        
        // Find start and end lines
        for (let i = 0; i < lines.length; i++) {
          const lineLength = lines[i].length + 1;
          if (currentPos <= start && start < currentPos + lineLength) {
            startLine = i;
          }
          if (currentPos < end && end <= currentPos + lineLength) {
            endLine = i;
            break;
          }
          currentPos += lineLength;
        }

        // Outdent
        const spaces = "  ";
        for (let i = startLine; i <= endLine; i++) {
          if (lines[i].startsWith(spaces)) {
            lines[i] = lines[i].substring(spaces.length);
          }
        }

        const newValue = lines.join("\n");
        onChange(newValue);
      }

      // Cmd/Ctrl + ] for indent
      if ((e.metaKey || e.ctrlKey) && e.key === "]") {
        e.preventDefault();
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const lines = value.split("\n");
        let currentPos = 0;
        let startLine = 0;
        let endLine = 0;
        
        // Find start and end lines
        for (let i = 0; i < lines.length; i++) {
          const lineLength = lines[i].length + 1;
          if (currentPos <= start && start < currentPos + lineLength) {
            startLine = i;
          }
          if (currentPos < end && end <= currentPos + lineLength) {
            endLine = i;
            break;
          }
          currentPos += lineLength;
        }

        // Indent
        const spaces = "  ";
        for (let i = startLine; i <= endLine; i++) {
          lines[i] = spaces + lines[i];
        }

        const newValue = lines.join("\n");
        onChange(newValue);
      }
    },
    [value, onChange]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  // Generate line numbers
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <div 
      className={cn("flex border rounded-md bg-muted/30 overflow-hidden", className)}
      style={{ 
        minHeight,
        maxHeight: maxHeight || minHeight,
        height: maxHeight ? undefined : minHeight 
      }}
    >
      {/* Line Numbers */}
      <div
        ref={lineNumbersRef}
        className="select-none px-3 py-2 text-right text-sm text-muted-foreground overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden"
        style={{
          fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace",
          lineHeight: "1.5rem",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {lineNumbers.map((num) => (
          <div key={num} style={{ height: "1.5rem" }}>
            {num}
          </div>
        ))}
      </div>

      {/* Code Textarea */}
      <textarea
        ref={textareaRef}
        id={id}
        name={name}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onScroll={handleScroll}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "flex-1 resize-none px-4 py-2 bg-transparent outline-none overflow-y-auto",
          "text-sm leading-6",
          "placeholder:text-muted-foreground",
          disabled && "cursor-not-allowed opacity-50"
        )}
        style={{
          fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace",
          lineHeight: "1.5rem",
          tabSize: 2,
        }}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
      />
    </div>
  );
}