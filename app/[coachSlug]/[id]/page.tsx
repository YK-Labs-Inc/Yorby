import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Logger } from "next-axiom";
import React from "react";
import CoachSignInForm from "../CoachSignInForm";
import { notFound, redirect } from "next/navigation";
import { H1, H2 } from "@/components/typography";
import { getTranslations } from "next-intl/server";
import JoinProgramButton from "../JoinProgramButton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface ProgramRegistrationPageProps {
  params: Promise<{
    coachSlug: string;
    id: string;
    locale: string;
  }>;
}

const fetchCoachAndProgram = async (coachSlug: string, programId: string) => {
  const logger = new Logger().with({
    function: "fetchCoachAndProgram",
    coachSlug,
    programId,
  });
  const supabase = await createSupabaseServerClient();

  // First get the coach
  const { data: coach, error: coachError } = await supabase
    .from("coaches")
    .select("*")
    .eq("slug", coachSlug)
    .single();

  if (coachError || !coach) {
    logger.warn("No coach found for slug", { coachError });
    await logger.flush();
    return null;
  }

  // Then get the specific program
  const { data: program, error: programError } = await supabase
    .from("custom_jobs")
    .select("*")
    .eq("coach_id", coach.id)
    .eq("user_id", coach.user_id)
    .eq("id", programId)
    .single();

  if (programError || !program) {
    logger.warn("No program found", { programError });
    await logger.flush();
    return null;
  }

  return { coach, program };
};

const checkUserEnrollment = async (
  userId: string,
  coachId: string,
  programId: string
) => {
  const supabase = await createSupabaseServerClient();

  // Check if user has coach access
  const { data: access } = await supabase
    .from("user_coach_access")
    .select("*")
    .eq("user_id", userId)
    .eq("coach_id", coachId)
    .maybeSingle();

  // Check if user is enrolled in this specific program
  const { data: enrollment } = await supabase
    .from("custom_job_enrollments")
    .select("*")
    .eq("user_id", userId)
    .eq("coach_id", coachId)
    .eq("custom_job_id", programId)
    .maybeSingle();

  return {
    hasCoachAccess: !!access,
    isEnrolled: !!enrollment,
  };
};

export default async function ProgramRegistrationPage({
  params,
}: ProgramRegistrationPageProps) {
  const { coachSlug, id } = await params;
  const data = await fetchCoachAndProgram(coachSlug, id);

  if (!data) {
    notFound();
  }

  const { coach, program } = data;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const t = await getTranslations("coachPortal");

  // If the current user is the coach, redirect to admin
  if (user && user.id === coach.user_id) {
    redirect(`/dashboard/coach-admin/programs/${program.id}`);
  }

  // Check user's enrollment status if logged in
  let enrollmentStatus = { hasCoachAccess: false, isEnrolled: false };
  if (user) {
    enrollmentStatus = await checkUserEnrollment(user.id, coach.id, program.id);
  }

  // Determine redirect URL based on enrollment status
  let redirectTo = `/api/coach/${coach.id}/register/${program.id}`;
  if (user && enrollmentStatus.isEnrolled) {
    // Check if user has a display name
    if (!user.user_metadata?.display_name) {
      redirectTo = `/coaches/onboarding?redirect=${encodeURIComponent(`/${coach.slug}/programs/${program.id}`)}`;
    } else {
      redirectTo = `/${coach.slug}/programs/${program.id}`;
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto py-6 sm:py-8 md:py-12 px-4 max-w-4xl">
        {/* Back button */}
        <Button
          variant="ghost"
          asChild
          className="mb-4 sm:mb-6 md:mb-8 -ml-2 sm:ml-0"
        >
          <Link href={`/${coach.slug}`}>
            <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="text-sm sm:text-base">Back to Programs</span>
          </Link>
        </Button>

        {/* Program Details Card */}
        <Card className="mb-6 sm:mb-8">
          <CardHeader className="space-y-2">
            <CardTitle className="text-xl sm:text-2xl md:text-3xl">
              {program.job_title}
            </CardTitle>
            {program.company_name && (
              <CardDescription className="text-base sm:text-lg">
                {program.company_name}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            {/* Program Description */}
            {program.job_description && (
              <div>
                <h3 className="font-semibold mb-2 text-sm sm:text-base">
                  About this Program
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground whitespace-pre-wrap">
                  {program.job_description}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Section */}
        <Card>
          <CardContent className="py-6 sm:py-8">
            <div className="text-center space-y-4 sm:space-y-6">
              {user ? (
                enrollmentStatus.isEnrolled ? (
                  <>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      {t("alreadyEnrolled")}
                    </p>
                    <JoinProgramButton
                      coachName={coach.name}
                      redirectTo={redirectTo}
                      isEnrolled={true}
                    />
                  </>
                ) : (
                  <>
                    <H2 className="text-xl sm:text-2xl">
                      {t("programTitle", {
                        programName: program.job_title,
                        coachName: coach.name,
                      })}
                    </H2>
                    <JoinProgramButton
                      coachName={coach.name}
                      redirectTo={redirectTo}
                    />
                  </>
                )
              ) : (
                <>
                  <H2 className="text-xl sm:text-2xl px-4">
                    {t("programTitle", {
                      programName: program.job_title,
                      coachName: coach.name,
                    })}
                  </H2>
                  <CoachSignInForm coachId={coach.id} redirectTo={redirectTo} />
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
