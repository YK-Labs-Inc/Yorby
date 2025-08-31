import React from "react";
import { redirect } from "next/navigation";
import { deleteCustomJob } from "../../actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { getTranslations } from "next-intl/server";
import { Logger } from "next-axiom";
import { getCoachId } from "../../../actions";
import { FormMessage } from "@/components/form-message";
import { getServerUser } from "@/utils/auth/server";

async function getJobDetails(programId: string, coachId: string) {
  const logger = new Logger().with({ programId, coachId });
  const supabase = await createSupabaseServerClient();

  // Fetch job details and count questions in one query
  const { data: job, error } = await supabase
    .from("custom_jobs")
    .select(`*, custom_job_questions(count)`)
    .eq("id", programId)
    .eq("coach_id", coachId)
    .single();

  if (error || !job) {
    logger.error("Error fetching job details or question count:", error);
    await logger.flush();
    return null;
  }

  // custom_job_questions is an array with one object: { count: number }
  const questionCount = job.custom_job_questions?.[0]?.count || 0;

  // Remove the embedded array to keep the return shape consistent
  const { custom_job_questions, ...jobData } = job;
  return { ...jobData, questionCount };
}

export default async function DeleteProgramPage({
  params,
  searchParams,
}: {
  params: Promise<{ programId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const t = await getTranslations(
    "coachAdminPortal.programsPage.programDeletionPage"
  );
  const { programId } = await params;
  const { error_message } = await searchParams;

  // Get the current user
  const user = await getServerUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Verify the user is a coach
  const coachId = await getCoachId(user.id);

  if (!coachId) {
    // User is not a coach, redirect to dashboard
    return redirect("/dashboard");
  }

  // Get job details
  const job = await getJobDetails(programId, coachId);

  if (!job) {
    // Job not found or doesn't belong to this coach
    return redirect("/dashboard/coach-admin/programs");
  }

  // Handle job deletion
  async function handleDeleteJob(formData: FormData) {
    "use server";
    const programId = formData.get("programId") as string;
    await deleteCustomJob(programId);
  }

  return (
    <div className="container mx-auto py-6">
      {/* Back button */}
      <div className="mb-6">
        <Button asChild variant="outline" size="sm">
          <Link href={`/dashboard/coach-admin/programs/${programId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("backToProgram")}
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-destructive flex items-center">
            <Trash2 className="h-5 w-5 mr-2" />
            {t("confirmTitle")}
          </CardTitle>
          <CardDescription>{t("confirmDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium">{t("programTitle")}</h3>
            <p className="text-lg">{job.job_title}</p>
          </div>

          <div>
            <h3 className="font-medium">{t("associatedQuestions")}</h3>
            <p>
              {t("questionsCount", {
                count: job.questionCount,
                plural: job.questionCount !== 1 ? "s" : "",
              })}
            </p>
          </div>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{t("warningTitle")}</AlertTitle>
            <AlertDescription>{t("warningDescription")}</AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/coach-admin/programs/${programId}`}>
              {t("cancel")}
            </Link>
          </Button>
          <form action={handleDeleteJob}>
            <input type="hidden" name="programId" value={programId} />
            <Button type="submit" variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              {t("delete")}
            </Button>
          </form>
        </CardFooter>
      </Card>
      {error_message && (
        <FormMessage
          message={{
            error: error_message as string,
          }}
        />
      )}
    </div>
  );
}
