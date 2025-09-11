import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { getServerUser } from "@/utils/auth/server";
import { CheckCircle2, UserCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { checkApplicationStatus } from "../../actions";
import { Button } from "@/components/ui/button";
import { InterviewCompletionMessage } from "../../candidate-interview/[candidateInterviewId]/InterviewCompletionMessage";
import { trackServerEvent } from "@/utils/tracking/serverUtils";

interface PageProps {
  params: Promise<{
    companyId: string;
    jobId: string;
  }>;
}

export default async function ApplicationSubmittedPage({ params }: PageProps) {
  const { companyId, jobId } = await params;
  if (!companyId || !jobId) {
    return notFound();
  }

  const supabase = await createSupabaseServerClient();

  const user = await getServerUser();

  if (!user) {
    redirect(`/apply/company/${companyId}/job/${jobId}`);
  }

  const result = await checkApplicationStatus(companyId, jobId, user.id);

  if (result.hasApplied) {
    if (!result.hasCompletedInterview && result.interviewId) {
      if (user.is_anonymous) {
        redirect(
          `/apply/company/${companyId}/job/${jobId}/application/confirm-email?interviewId=${result.interviewId}`
        );
      }
      // User has applied and has an interview ID, redirect to specific interview page
      redirect(
        `/apply/company/${companyId}/job/${jobId}/interview/${result.interviewId}`
      );
    }
  } else {
    redirect(`/apply/company/${companyId}/job/${jobId}`);
  }

  const t = await getTranslations("apply");

  // Get the user's email to display
  const userEmail = user.email || user.new_email || "Anonymous";

  // Server action to sign out and redirect
  async function applyWithDifferentEmail() {
    "use server";
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
    redirect(`/apply/company/${companyId}/job/${jobId}`);
  }

  await trackServerEvent({
    userId: user.id,
    eventName: "application_submitted",
    args: {
      jobId,
      companyId,
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full px-4">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle>{t("applicationSubmitted.title")}</CardTitle>
            <CardDescription>
              {t("applicationSubmitted.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <UserCircle className="h-5 w-5 text-gray-600" />
                <p className="text-sm text-gray-600">
                  {t("applicationSubmitted.appliedAs")}
                </p>
              </div>
              <p className="font-semibold text-lg">{userEmail}</p>
            </div>

            <InterviewCompletionMessage />

            <div className="border-t pt-6">
              <p className="text-sm text-gray-600 mb-4">
                {t("applicationSubmitted.notYou")}
              </p>
              <form action={applyWithDifferentEmail}>
                <Button type="submit" variant="outline" className="w-full">
                  {t("applicationSubmitted.applyDifferentEmail")}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
