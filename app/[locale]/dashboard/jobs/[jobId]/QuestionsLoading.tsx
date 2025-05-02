import React from "react";

const QuestionsLoading = () => {
  return (
    <div className="flex flex-col gap-4 w-full mt-4">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="h-16 w-full bg-gray-200 dark:bg-gray-800 rounded-md animate-pulse"
        />
      ))}
    </div>
  );
};

export default QuestionsLoading;
