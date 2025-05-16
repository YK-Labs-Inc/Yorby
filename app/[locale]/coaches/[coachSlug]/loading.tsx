import React from "react";

const Loading = () => (
  <div className="flex items-center justify-center min-h-screen w-full bg-background">
    <div className="flex flex-col gap-6 w-full max-w-xl px-4">
      <div className="h-24 w-full rounded-lg bg-muted animate-pulse" />
      <div className="h-24 w-full rounded-lg bg-muted animate-pulse" />
    </div>
  </div>
);

export default Loading;
