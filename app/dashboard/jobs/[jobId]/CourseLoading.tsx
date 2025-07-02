import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function CourseLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Course Header Skeleton */}
      <Card>
        <CardHeader>
          <div className="space-y-4">
            <div>
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-full mt-2" />
            </div>
            <div className="flex items-center gap-6">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Course Content Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Module Skeletons */}
          {[1, 2].map((module) => (
            <div key={module}>
              <div className="mb-4">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64 mt-1" />
              </div>
              <div className="space-y-2">
                {[1, 2, 3].map((lesson) => (
                  <div
                    key={lesson}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </div>
                    <Skeleton className="h-5 w-5" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}