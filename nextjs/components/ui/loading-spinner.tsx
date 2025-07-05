import { cn } from "@/lib/utils";
import { VariantProps, cva } from "class-variance-authority";

const spinnerVariants = cva(
  "inline-block animate-spin rounded-full border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]",
  {
    variants: {
      size: {
        default: "h-4 w-4 border-2",
        sm: "h-3 w-3 border",
        lg: "h-6 w-6 border-[3px]",
        xl: "h-8 w-8 border-4",
      },
      variant: {
        default: "text-gray-900 dark:text-gray-100",
        muted: "text-gray-600 dark:text-gray-400",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  }
);

interface LoadingSpinnerProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof spinnerVariants> {}

export function LoadingSpinner({
  className,
  size,
  variant,
  ...props
}: LoadingSpinnerProps) {
  return (
    <span
      className={cn(spinnerVariants({ size, variant }), className)}
      {...props}
    />
  );
}
