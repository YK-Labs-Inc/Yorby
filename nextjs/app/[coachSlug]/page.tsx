import { createSupabaseServerClient } from "@/utils/supabase/server";
import { getServerUser } from "@/utils/auth/server";
import { Logger } from "next-axiom";
import React from "react";
import { notFound, redirect } from "next/navigation";
import { H1, H2 } from "@/components/typography";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

interface CoachPortalLandingPageProps {
  params: Promise<{
    coachSlug: string;
    locale: string;
  }>;
}

const fetchCoach = async (coachSlug: string) => {
  const logger = new Logger().with({
    function: "fetchCoach",
    coachSlug,
  });
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("coaches")
    .select("*")
    .eq("slug", coachSlug)
    .single();
  if (error) {
    logger.warn("No coach found for slug", { error });
    await logger.flush();
    return null;
  }
  return data;
};

const fetchCoachPrograms = async (coachId: string, coachUserId: string) => {
  const logger = new Logger().with({
    function: "fetchCoachPrograms",
    coachId,
    coachUserId,
  });
  const supabase = await createSupabaseServerClient();

  // Get all programs for this coach
  const { data: programs, error } = await supabase
    .from("custom_jobs")
    .select(
      `
      id,
      job_title,
      job_description,
      company_name,
      company_description,
      created_at
    `
    )
    .eq("coach_id", coachId)
    .eq("user_id", coachUserId)
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("Error fetching coach programs", { error });
    await logger.flush();
    return [];
  }

  return programs || [];
};

const checkUserEnrollments = async (userId: string, coachId: string) => {
  const supabase = await createSupabaseServerClient();

  // Check if user has access to this coach
  const { data: access } = await supabase
    .from("user_coach_access")
    .select("*")
    .eq("user_id", userId)
    .eq("coach_id", coachId)
    .maybeSingle();

  // Get user's enrollments for this coach
  const { data: enrollments } = await supabase
    .from("custom_job_enrollments")
    .select("custom_job_id")
    .eq("user_id", userId)
    .eq("coach_id", coachId);

  const enrolledJobIds = enrollments?.map((e) => e.custom_job_id) || [];

  return {
    hasCoachAccess: !!access,
    enrolledJobIds,
  };
};

export default async function CoachPortalLandingPage({
  params,
}: CoachPortalLandingPageProps) {
  const { coachSlug } = await params;
  const coach = await fetchCoach(coachSlug);
  if (!coach) {
    notFound();
  }

  const user = await getServerUser();
  const t = await getTranslations("coachPortal");
  const supabase = await createSupabaseServerClient();

  // If the current user is the coach, redirect to admin
  if (user && user.id === coach.user_id) {
    redirect("/dashboard/coach-admin/programs");
  }

  // Fetch all programs for this coach
  const programs = await fetchCoachPrograms(coach.id, coach.user_id);

  // Check user's enrollment status if logged in
  let userEnrollmentStatus = {
    hasCoachAccess: false,
    enrolledJobIds: [] as string[],
  };
  if (user) {
    userEnrollmentStatus = await checkUserEnrollments(user.id, coach.id);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10">
      {/* Hero Section */}
      <div className="bg-background border-b">
        <div className="container mx-auto py-8 sm:py-12 md:py-16 px-4">
          <div className="text-center max-w-3xl mx-auto">
            <H1 className="text-2xl sm:text-3xl md:text-4xl mb-4">
              {t("welcomeTitle", { coachName: coach.name })}
            </H1>
          </div>
        </div>
      </div>

      {/* Programs Section */}
      <div className="container mx-auto py-8 sm:py-12 px-4">
        {programs.length === 0 ? (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="text-center py-8 sm:py-12 md:py-16">
              <p className="text-base sm:text-lg text-muted-foreground">
                {t("noProgramsAvailable")}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div
              className={`grid gap-6 mx-auto ${
                programs.length === 1
                  ? "max-w-2xl"
                  : programs.length === 2
                    ? "max-w-4xl md:grid-cols-2"
                    : "max-w-6xl md:grid-cols-2 lg:grid-cols-3"
              }`}
            >
              {programs.map((program) => {
                const isEnrolled = userEnrollmentStatus.enrolledJobIds.includes(
                  program.id
                );

                return (
                  <Card
                    key={program.id}
                    className="group hover:shadow-xl transition-all duration-300 overflow-hidden h-full flex flex-col"
                  >
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg sm:text-xl">
                        {program.job_title}
                      </CardTitle>
                      {program.company_name && (
                        <CardDescription className="text-sm sm:text-base">
                          {program.company_name}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4 sm:space-y-6 flex-1 flex flex-col">
                      {program.job_description && (
                        <p className="text-sm text-muted-foreground line-clamp-3 sm:line-clamp-4 leading-relaxed flex-1">
                          {program.job_description}
                        </p>
                      )}

                      <Button
                        asChild
                        className="w-full group-hover:scale-[1.02] transition-transform"
                        size="default"
                        variant={isEnrolled ? "secondary" : "default"}
                      >
                        <Link
                          href={`/${coach.slug}/${program.id}`}
                        >
                          <span className="text-sm sm:text-base">
                            {isEnrolled
                              ? t("viewProgram")
                              : t("enrollInProgram")}
                          </span>
                          <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
