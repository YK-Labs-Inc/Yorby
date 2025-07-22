import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="h-screen bg-white flex flex-col">
      <div className="container mx-auto px-4 pt-4 flex-shrink-0">
        {/* Breadcrumb skeleton */}
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-4 w-24" />
          <span className="text-sm text-muted-foreground">/</span>
          <Skeleton className="h-4 w-32" />
          <span className="text-sm text-muted-foreground">/</span>
          <Skeleton className="h-4 w-20" />
        </div>

        {/* Header skeleton */}
        <Skeleton className="h-4 w-32 mb-4" />
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 pb-4 flex-1 flex gap-6 min-h-0">
        {/* Left Sidebar skeleton */}
        <Skeleton className="h-full w-[400px] flex-shrink-0" />

        {/* Right Content skeleton */}
        <Skeleton className="h-full flex-1" />
      </div>
    </div>
  );
}
