import React from "react";

const Loading = () => {
  return (
    <div className="w-full flex flex-col justify-center items-center p-2 md:p-8 gap-6">
      <div className="gap-6 w-full flex-col md:flex-row md:justify-between items-start md:items-center flex">
        <div className="h-12 w-3/4 md:w-2/5 bg-gray-200 rounded-md animate-pulse mb-2" />
        <div className="h-10 w-36 bg-gray-200 rounded-md animate-pulse" />
      </div>

      <div className="flex flex-col gap-6 w-full">
        <div className="flex flex-col md:flex-row items-start gap-2 md:items-center justify-between w-full">
          <div className="flex gap-2 w-full max-w-md">
            <div className="h-10 w-40 bg-gray-200 rounded-md animate-pulse" />
            <div className="h-10 w-40 bg-gray-200 rounded-md animate-pulse" />
          </div>
          <div className="h-10 w-56 bg-gray-200 rounded-md animate-pulse mt-2 md:mt-0" />
        </div>

        <div className="flex flex-col gap-4 mt-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-16 w-full bg-gray-200 rounded-md animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Loading;
