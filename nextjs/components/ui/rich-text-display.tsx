import { cn } from "@/lib/utils";

interface RichTextDisplayProps {
  content: string;
  className?: string;
  prose?: "prose" | "prose-sm" | "prose-lg" | "prose-xl";
}

export function RichTextDisplay({ 
  content, 
  className,
  prose = "prose-sm"
}: RichTextDisplayProps) {
  if (!content) {
    return (
      <div className={cn("text-muted-foreground", className)}>
        No content
      </div>
    );
  }

  return (
    <div 
      className={cn(
        prose,
        "max-w-none",
        "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2",
        className
      )}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}