import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const signUpToWaitlist = async (formData: FormData) => {
    "use server";
    const supabase = await createClient();
    const email = formData.get("email") as string;
    const { error } = await supabase.from("email_waitlist").insert({ email });
    if (error) {
      throw error;
    }
    redirect("/?signed_up=true");
  };
  const signedUp = (await searchParams).signed_up === "true";
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
      <form
        className="flex flex-col gap-2 text-center"
        action={signUpToWaitlist}
      >
        <p className="text-lg text-foreground/60">
          Join the waitlist to get notified when we launch.
        </p>
        <p className="text-sm text-foreground/60">
          You will receive a 50% discount when we launch.
        </p>
        <Input name="email" placeholder="Enter your email" type="email" />
        <SubmitButton>Get Notified When We Launch</SubmitButton>
      </form>
    </main>
  );
}
