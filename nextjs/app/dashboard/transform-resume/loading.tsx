import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Loading() {
  return (
    <div className="container mx-auto py-4 h-full">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Transform Resume</h1>
        <Skeleton className="h-9 w-36" />
      </div>

      <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-8rem)]">
        <div className="w-full lg:w-full h-full transition-all duration-300 ease-in-out">
          <Card className="p-4 h-full flex flex-col">
            <CardHeader className="px-0 pt-0 sticky top-0 bg-background z-10 flex flex-row items-center justify-between">
              <CardTitle>Select Resume</CardTitle>
              <Skeleton className="h-9 w-32" />
            </CardHeader>
            <div className="overflow-y-auto min-h-0">
              <Card className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* File skeletons - first row */}
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-4">
                      <Card className="cursor-pointer transition-colors hover:bg-accent/50">
                        <CardHeader className="p-4">
                          <div className="flex items-center justify-between">
                            <Skeleton className="h-5 w-[120px]" />
                          </div>
                        </CardHeader>
                      </Card>
                    </div>
                  ))}

                  {/* Resume skeletons - second row */}
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={`resume-${i}`} className="space-y-4">
                      <Card className="cursor-pointer transition-colors hover:bg-accent/50">
                        <CardHeader className="p-4">
                          <div className="flex items-center justify-between">
                            <Skeleton className="h-5 w-[150px]" />
                          </div>
                        </CardHeader>
                      </Card>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
