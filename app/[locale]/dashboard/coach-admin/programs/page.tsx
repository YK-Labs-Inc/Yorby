import React from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, MoreVertical, Pencil, Trash2, ChevronRight } from "lucide-react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Logger } from "next-axiom";
import { getTranslations } from "next-intl/server";

async function getCoachJobs(userId: string) {
  const supabase = await createSupabaseServerClient();
  const logger = new Logger().with({ function: "getCoachJobs", userId });

  // First, get the coach ID for the current user
  const { data: coachData, error: coachError } = await supabase
    .from("coaches")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (coachError || !coachData) {
    logger.error("Error fetching coach data:", coachError);
    await logger.flush();
    return { jobs: [], error: coachError || new Error("Coach not found") };
  }

  // Get all custom jobs for this coach
  const { data: jobs, error: jobsError } = await supabase
    .from("custom_jobs")
    .select(
      `
      id, 
      job_title, 
      company_name,
      created_at,
      custom_job_questions (count)
    `
    )
    .eq("coach_id", coachData.id)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (jobsError) {
    logger.error("Error fetching jobs:", jobsError);
    await logger.flush();
    return { jobs: [], error: jobsError };
  }

  return {
    jobs: jobs || [],
    coachId: coachData.id,
    error: null,
  };
}

export default async function ProgramsPage() {
  const supabase = await createSupabaseServerClient();
  const t = await getTranslations("coachAdminPortal.programsPage");

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const { jobs, error } = await getCoachJobs(user.id);

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        </div>
        <Button asChild>
          <Link href="/dashboard/coach-admin/programs/new">
            <Plus className="h-4 w-4 mr-2" />
            {t("createProgramButton")}
          </Link>
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <Card className="mb-6 border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">
              {t("errorTitle")}
            </CardTitle>
            <CardDescription>{t("errorDescription")}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Empty state */}
      {!error && jobs.length === 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t("noProgramsTitle")}</CardTitle>
            <CardDescription>{t("noProgramsDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard/coach-admin/programs/new">
                <Plus className="h-4 w-4 mr-2" />
                {t("createFirstProgramButton")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Programs table */}
      {!error && jobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("yourProgramsTitle")}</CardTitle>
            <CardDescription>{t("yourProgramsDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("table.programTitle")}</TableHead>
                  <TableHead>{t("table.questions")}</TableHead>
                  <TableHead>{t("table.created")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((program) => (
                  <TableRow key={program.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/dashboard/coach-admin/programs/${program.id}`}
                        className="hover:underline text-primary"
                      >
                        {program.job_title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {t("questionsCount", {
                        count: program.custom_job_questions[0].count,
                      })}
                    </TableCell>
                    <TableCell>
                      {t("createdAtFormat", {
                        date: new Date(program.created_at),
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
