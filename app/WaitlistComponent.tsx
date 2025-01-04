"use client";

import { Suspense, useState } from "react";
import { useActionState } from "react";
import { signUpToWaitlist } from "./actions";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";

const WaitlistComponent = () => {
  const [state, formAction, pending] = useActionState(signUpToWaitlist, {
    status: "",
  });
  const [email, setEmail] = useState("");

  const searchParams = useSearchParams();
  const signedUp = searchParams.get("signed_up") === "true";
  if (signedUp) {
    return (
      <main className="flex-1 flex flex-col gap-6 px-4">
        <h1 className="text-4xl font-bold tracking-tight text-center">
          Thanks for Signing Up!
        </h1>
        <p className="text-lg text-foreground/60 text-center">
          We'll notify you when we launch with your exclusive 50% discount.
        </p>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col gap-6 px-4">
      <h1 className="text-4xl font-bold tracking-tight text-center">
        Perfect Your Next Interview
      </h1>
      <p className="text-lg text-foreground/60 text-center">
        Get AI-powered interview prep to ace your next job interview.
      </p>
      <form className="flex flex-col gap-2 text-center" action={formAction}>
        <p className="text-lg text-foreground/60">
          Join the waitlist to get notified when we launch.
        </p>
        <p className="text-sm text-foreground/60">
          You will receive a 50% discount when we launch.
        </p>
        <Input
          name="email"
          placeholder="Enter your email"
          type="email"
          onChange={(e) => setEmail(e.target.value)}
        />
        <SubmitButton disabled={pending || !email}>
          {pending ? "Submitting..." : "Get Notified When We Launch"}
        </SubmitButton>
        {state.status === "error" && (
          <p className="text-sm text-red-500">
            Error signing up. Please try again.
          </p>
        )}
      </form>
    </main>
  );
};

export default function Page() {
  return (
    <Suspense>
      <WaitlistComponent />
    </Suspense>
  );
}
