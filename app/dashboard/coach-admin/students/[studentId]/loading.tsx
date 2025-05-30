import React from "react";

export default function Loading() {
  return (
    <div className="relative w-full min-h-screen bg-white">
      {/* Header Bar */}
      <div className="sticky top-0 z-30 w-full bg-white border-b flex flex-col md:flex-row items-start md:items-center justify-between px-6 py-4 gap-2 md:gap-0 animate-pulse">
        <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 w-full md:w-auto">
          <div>
            <div className="h-6 w-40 bg-gray-200 rounded mb-2" />
            <div className="flex flex-row gap-2 items-center">
              <div className="h-4 w-16 bg-gray-200 rounded" />
              <span className="mx-1">&bull;</span>
              <div className="h-4 w-20 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
        <div className="flex flex-row items-center gap-6 mt-2 md:mt-0">
          <div className="flex items-center gap-1 text-gray-500">
            <div className="flex flex-col gap-2 items-center">
              <div className="flex flex-row items-center gap-1">
                <div className="w-4 h-4 bg-gray-200 rounded-full mr-1" />
                <div className="h-4 w-16 bg-gray-200 rounded" />
              </div>
              <div className="ml-1 h-4 w-24 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </div>
      {/* Sidebar and Main Content Row */}
      <div
        className="flex flex-row w-full min-h-0"
        style={{ height: "calc(100vh - 90px)" }}
      >
        {/* Sidebar */}
        <aside className="w-80 border-r flex flex-col overflow-y-auto h-full min-h-0">
          <div className="p-6 border-b">
            <div className="w-full bg-white border rounded-lg shadow-sm px-4 py-3 animate-pulse">
              <div className="h-5 w-32 bg-gray-200 rounded mb-2" />
              <div className="h-4 w-20 bg-gray-100 rounded" />
            </div>
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <li
                  key={i}
                  className="rounded-lg px-4 py-3 flex flex-col gap-1 bg-white border animate-pulse"
                >
                  <div className="h-4 w-48 bg-gray-200 rounded mb-2" />
                  <div className="h-3 w-32 bg-gray-100 rounded" />
                </li>
              ))}
            </ul>
          </div>
        </aside>
        {/* Main Content */}
        <div className="flex-1 px-4 md:px-8 py-6 overflow-y-auto h-full min-h-0">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-6 w-full bg-gray-200 rounded animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
