import { createSupabaseServerClient } from "@/utils/supabase/server";
import { getServerUser } from "@/utils/auth/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { H1 } from "@/components/typography";
import { Logger } from "next-axiom";

export default async function CoachesAuthPage() {
  const supabase = await createSupabaseServerClient();
  const user = await getServerUser();

  // If user is not authenticated, show sign-in prompt
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-4xl mx-auto pt-20">
          <div className="text-center">
            <H1 className="text-4xl font-bold mb-4">
              Welcome to Coaching Programs
            </H1>
            <p className="text-xl text-muted-foreground mb-8">
              Please sign in to access your coaching programs.
            </p>
            <div className="flex flex-col gap-4 max-w-sm mx-auto">
              <Button asChild>
                <Link href="/sign-in">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check if user has a display name, if not redirect to onboarding
  if (!user.user_metadata?.display_name) {
    redirect("/coaches/onboarding");
  }

  // Check if user is a coach
  const { data: coachData } = await supabase
    .from("coaches")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  // If user is a coach, redirect to coach admin
  if (coachData) {
    redirect("/dashboard/coach-admin/programs");
  }

  // If user is not a coach, redirect to student programs page
  redirect("/student-programs");
}
