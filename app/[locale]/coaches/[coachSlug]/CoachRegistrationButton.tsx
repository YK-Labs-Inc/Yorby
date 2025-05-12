"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";

interface CoachRegistrationButtonProps {
  coachId: string;
  coachName: string;
}

export default function CoachRegistrationButton({
  coachId,
  coachName,
}: CoachRegistrationButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    setError(null);
    startTransition(async () => {
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
      }
    });
  };

  return (
    <div className="flex flex-col items-center mt-4">
      <Button
        onClick={handleClick}
        disabled={isPending}
        className="w-full"
        size="lg"
      >
        {isPending ? "Joining Program..." : `Join ${coachName}'s Program`}
      </Button>
      {error && <p className="text-red-500 text-sm mt-2">Error: {error}</p>}
    </div>
  );
}
