import { createSupabaseServerClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { H1 } from "@/components/typography";
import { Logger } from "next-axiom";

const userPrograms = async (userId: string) => {
  const logger = new Logger().with({ userId });
  const supabase = await createSupabaseServerClient();

  const { data, error: accessError } = await supabase
    .from("custom_jobs")
    .select("*, coach:coach_id(slug, name, id)")
    .eq("user_id", userId);

  if (accessError) {
    logger.error("Error fetching user coach access", { error: accessError });
    await logger.flush();
    return [];
  }

  logger.info("User coach access entries", {
    data,
  });

  if (!data || data.length === 0) {
    return [];
  }

  return data;
};

export default async function CoachesAuthPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
              <Button variant="outline" asChild>
                <Link href="/sign-up">Sign Up</Link>
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

  const programs = await userPrograms(user.id);

  // If user has no coach access
  if (programs.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-4xl mx-auto pt-20">
          <div className="text-center">
            <H1 className="text-4xl font-bold mb-4">
              No Coaching Programs Found
            </H1>
            <Button asChild variant="outline">
              <Link href="/dashboard/jobs">Go to Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If user has exactly one coach access, redirect to that coach's program
  if (programs.length === 1) {
    const program = programs[0];
    redirect(`/${program.coach?.slug}/programs/${program.id}`);
  }

  // If user has multiple coach access entries, show table
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto pt-20">
        <div className="text-center mb-8">
          <H1 className="text-4xl font-bold mb-4">Your Coaching Programs</H1>
          <p className="text-xl text-muted-foreground">
            You have access to {programs.length} coaching programs. Select one
            to continue.
          </p>
        </div>

        <div className="bg-card border rounded-lg p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Coach Name</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {programs.map((program) => (
                <TableRow key={program.coach_id}>
                  <TableCell className="font-medium">
                    {program.coach?.name}
                  </TableCell>
                  <TableCell>
                    <Button asChild size="sm">
                      <Link
                        href={`/${program.coach?.slug}/programs/${program.id}`}
                      >
                        View Program
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
