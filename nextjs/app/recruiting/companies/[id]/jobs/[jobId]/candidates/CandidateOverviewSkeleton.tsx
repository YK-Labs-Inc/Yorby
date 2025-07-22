import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function CandidateOverviewSkeleton() {
  return (
    <Card className="h-full flex flex-col bg-white border shadow-sm">
      <CardHeader className="flex-shrink-0 border-b">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
      </CardHeader>

      <CardContent className="space-y-6 flex-1 overflow-y-auto py-6">
        {/* Contact Information Section */}
        <div>
          <Skeleton className="h-4 w-32 mb-3" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>

        <Separator />

        {/* Notes Section */}
        <div>
          <Skeleton className="h-4 w-20 mb-3" />
          <Skeleton className="h-16 w-full" />
        </div>

        <Separator />

        {/* Resume Details Section */}
        <div>
          <Skeleton className="h-4 w-32 mb-3" />
          <Skeleton className="h-12 w-full" />
        </div>

        <Separator />

        {/* Interview History Section */}
        <div>
          <Skeleton className="h-4 w-36 mb-3" />
          <Skeleton className="h-12 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}
