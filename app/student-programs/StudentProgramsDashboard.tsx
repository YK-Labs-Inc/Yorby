"use client";

import useSWR from "swr";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, Calendar, ChevronRight } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";
import { useTranslations } from "next-intl";
import { useAxiomLogging, LogFunction } from "@/context/AxiomLoggingContext";
import { Skeleton } from "@/components/ui/skeleton";

interface StudentProgram {
  id: string;
  job_title: string;
  company_name: string | null;
  created_at: string;
  coach: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

interface StudentProgramsDashboardProps {
  userId: string;
}

// Fetcher function for SWR
const fetchStudentPrograms = async (
  userId: string,
  logError: LogFunction
): Promise<StudentProgram[]> => {
  const supabase = createSupabaseBrowserClient();

  // Fetch custom jobs where the user is enrolled and has a source_custom_job_id (meaning it's a duplicated program)
  const { data, error } = await supabase
    .from("custom_jobs")
    .select(
      `
      id,
      job_title,
      company_name,
      created_at,
      coach_id,
      coaches!coach_id (
        id,
        name,
        slug
      )
    `
    )
    .eq("user_id", userId)
    .not("source_custom_job_id", "is", null)
    .order("created_at", { ascending: false });

  if (error) {
    logError("Error fetching student programs", {
      error: error.message,
      userId,
      code: error.code,
      details: error.details,
    });
    throw error;
  }

  return (
    data?.map((program) => ({
      ...program,
      coach: program.coaches,
    })) || []
  );
};

export default function StudentProgramsDashboard({
  userId,
}: StudentProgramsDashboardProps) {
  const t = useTranslations("studentPrograms");
  const { logError } = useAxiomLogging();

  const {
    data: programs,
    error,
    isLoading,
  } = useSWR(
    [`student-programs`, userId],
    () => fetchStudentPrograms(userId, logError),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  if (isLoading) {
    return (
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="mb-8">
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-80" />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <Skeleton className="h-5 w-5 rounded" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
                <Skeleton className="h-10 w-full mt-4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-6xl mx-auto py-8">
        <div className="text-center">
          <p className="text-destructive">
            {error.message || t("error.loadFailed")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      {programs?.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">
              {t("noPrograms.title")}
            </h3>
            <p className="text-muted-foreground">
              {t("noPrograms.description")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {programs?.map((program) => (
            <Card
              key={program.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
            >
              <Link href={`/${program.coach?.slug}/programs/${program.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="line-clamp-1">
                        {program.job_title}
                      </CardTitle>
                      {program.company_name && (
                        <CardDescription className="line-clamp-1">
                          {program.company_name}
                        </CardDescription>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {program.coach && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="font-medium">
                          {t("programCard.coach")}:
                        </span>
                        <span>{program.coach.name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {t("programCard.enrolled")}{" "}
                        {format(new Date(program.created_at), "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>
                  <Button className="w-full mt-4" variant="outline">
                    {t("programCard.continueButton")}
                  </Button>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
