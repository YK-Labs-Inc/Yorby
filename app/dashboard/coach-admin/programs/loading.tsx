import React from "react";

export default function ProgramLoading() {
  return (
    <div className="container mx-auto py-6">
      {/* Header skeleton */}
      <div className="flex justify-between items-center mb-8">
        <div className="h-10 w-64 rounded bg-muted animate-pulse" />
        <div className="h-10 w-40 rounded bg-muted animate-pulse" />
      </div>

      {/* Card skeleton */}
      <div className="rounded-xl border bg-card text-card-foreground shadow mb-6">
        <div className="p-6 border-b">
          <div className="h-6 w-48 rounded bg-muted animate-pulse mb-2" />
          <div className="h-4 w-72 rounded bg-muted animate-pulse" />
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  {[...Array(5)].map((_, i) => (
                    <th key={i} className="px-4 py-3">
                      <div className="h-4 w-24 rounded bg-muted animate-pulse" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...Array(4)].map((_, rowIdx) => (
                  <tr key={rowIdx}>
                    {[...Array(5)].map((_, colIdx) => (
                      <td key={colIdx} className="px-4 py-4">
                        <div
                          className="h-4 w-full rounded bg-muted animate-pulse"
                          style={{
                            width:
                              colIdx === 0
                                ? "120px"
                                : colIdx === 1
                                  ? "160px"
                                  : colIdx === 2
                                    ? "48px"
                                    : colIdx === 3
                                      ? "100px"
                                      : "32px",
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
