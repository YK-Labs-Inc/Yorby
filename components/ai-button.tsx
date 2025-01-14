"use client";

import { Button } from "@/components/ui/button";
import { type ComponentProps } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = ComponentProps<typeof Button> & {
  pending?: boolean;
  pendingText: string;
};

export function AIButton({
  children,
  pending = false,
  pendingText,
  variant = "default",
  className,
  ...props
}: Props) {
  return (
    <Button
      variant={variant}
      className={cn(
        "relative overflow-hidden bg-gradient-to-r from-indigo-500/90 to-purple-500/90 dark:from-indigo-600/90 dark:to-purple-600/90",
        "hover:shadow-[inset_0_1px_20px_rgba(255,255,255,0.2)] dark:hover:shadow-[inset_0_1px_20px_rgba(255,255,255,0.1)]",
        "transition-all duration-500",
        "before:absolute before:inset-0 before:bg-[length:200%_200%] before:opacity-20 before:animate-subtle-sparkle before:bg-[radial-gradient(circle,rgba(255,255,255,0.8)_1px,transparent_1px)]",
        "text-white",
        className
      )}
      {...props}
    >
      <span className="flex items-center gap-2">
        {pending ? (
          <>
            <Sparkles className="h-4 w-4 animate-pulse" />
            {pendingText}
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            {children}
          </>
        )}
      </span>
    </Button>
  );
}
