"use client";

import { useSearchParams } from "next/navigation";

export type Message =
  | { success: string }
  | { error: string }
  | { message: string };

export function FormMessage() {
  const searchParams = useSearchParams();
  const successMessage = searchParams.get("success");
  const errorMessage = searchParams.get("error");
  const message = searchParams.get("message");

  if (!successMessage && !errorMessage && !message) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 w-full text-sm mt-4">
      {successMessage && (
        <div className="bg-green-100 text-green-800 rounded-md px-4 py-3 text-center">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="bg-red-100 text-red-800 rounded-md px-4 py-3 text-center">
          {errorMessage}
        </div>
      )}
      {message && (
        <div className="bg-gray-100 text-gray-800 rounded-md px-4 py-3 text-center">
          {message}
        </div>
      )}
    </div>
  );
}
