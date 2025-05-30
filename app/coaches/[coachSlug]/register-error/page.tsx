"use client";

import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useState } from "react";

export default function RegisterErrorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const coachId = searchParams?.get("coachId") ?? "";

  const handleRetry = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/coach/${coachId}/register`, {
        method: "GET",
      });
      if (res.redirected) {
        router.push(res.url);
        return;
      }
      const data = await res.json();
      setError(data.error || "Unknown error");
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-lg shadow-md p-8 flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-4 text-center text-red-600">
          Registration Failed
        </h1>
        <p className="mb-6 text-center text-muted-foreground">
          We couldn't register you for this coach's program. This could be a
          temporary issue. Please try again.
        </p>
        {error && <div className="mb-4 text-red-500 text-center">{error}</div>}
        <button
          className="w-full py-2 px-4 bg-primary text-white rounded hover:bg-primary/90 transition disabled:opacity-50"
          onClick={handleRetry}
          disabled={loading}
        >
          {loading ? "Retrying..." : "Retry"}
        </button>
      </div>
    </div>
  );
}
