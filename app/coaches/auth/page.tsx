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
import { H1, P } from "@/components/typography";
import { Logger } from "next-axiom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

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

  const programs = await userPrograms(user.id);

  // If user has no coach access (they are a student without any programs)
  if (programs.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-4xl mx-auto pt-20">
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center pb-3">
              <div className="mx-auto bg-yellow-100 dark:bg-yellow-900/20 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-yellow-600 dark:text-yellow-500" />
              </div>
              <H1 className="text-2xl font-bold">For Coaches Only</H1>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <P className="text-muted-foreground">
                This page is exclusively for coaches to manage their programs.
              </P>
              <P className="text-muted-foreground">
                If you're a student looking to join a coach's program, please ask your coach for their unique program link.
              </P>
              <div className="pt-4">
                <Button asChild variant="outline">
                  <Link href="/">Go to Home Page</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
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
