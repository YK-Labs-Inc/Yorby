import React from "react";
import { redirect } from "next/navigation";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { getServerUser } from "@/utils/auth/server";
import Link from "next/link";
import { deleteSampleAnswer } from "./actions";
import { FormMessage } from "@/components/form-message";
import { getTranslations } from "next-intl/server";

// Helper function to get coach ID from user ID
async function getCoachId(userId: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("coaches")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    console.error("Error fetching coach ID:", error);
    return null;
  }

  return data.id;
}

// Function to fetch sample answer details
async function getSampleAnswerDetails(answerId: string) {
  const supabase = await createSupabaseServerClient();

  const { data: sampleAnswer, error } = await supabase
    .from("custom_job_question_sample_answers")
    .select("*")
    .eq("id", answerId)
    .single();

  if (error || !sampleAnswer) {
    console.error("Error fetching sample answer details:", error);
    return null;
  }

  return sampleAnswer;
}

export default async function DeleteSampleAnswerPage({
  params,
  searchParams,
}: {
  params: Promise<{ programId: string; questionId: string; answerId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const t = await getTranslations("coachAdminPortal.sampleAnswerDeletePage");
  const { programId, questionId, answerId } = await params;
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
    return redirect("/onboarding");
  }

  // Get sample answer details
  const sampleAnswer = await getSampleAnswerDetails(answerId);

  if (!sampleAnswer) {
    // Sample answer not found or doesn't belong to this question
    return redirect(
      `/dashboard/coach-admin/programs/${programId}/questions/${questionId}`
    );
  }

  return (
    <div className="container mx-auto py-6">
      {/* Back button */}
      <div className="mb-6">
        <Link
          href={`/dashboard/coach-admin/programs/${programId}/questions/${questionId}`}
        >
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("navigation.backButton")}
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-destructive flex items-center">
            <Trash2 className="h-5 w-5 mr-2" />
            {t("header.title")}
          </CardTitle>
          <CardDescription>{t("header.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium">{t("content.sampleAnswerLabel")}</h3>
            <div className="bg-muted p-4 rounded-md whitespace-pre-wrap text-sm mt-1">
              {sampleAnswer.answer}
            </div>
          </div>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{t("content.warning.title")}</AlertTitle>
            <AlertDescription>
              {t("content.warning.description")}
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild>
            <Link
              href={`/dashboard/coach-admin/programs/${programId}/questions/${questionId}/sample-answers`}
            >
              {t("actions.cancel")}
            </Link>
          </Button>
          <form action={deleteSampleAnswer}>
            <input type="hidden" name="answerId" value={answerId} />
            <input type="hidden" name="questionId" value={questionId} />
            <input type="hidden" name="programId" value={programId} />
            <Button type="submit" variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              {t("actions.delete")}
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
