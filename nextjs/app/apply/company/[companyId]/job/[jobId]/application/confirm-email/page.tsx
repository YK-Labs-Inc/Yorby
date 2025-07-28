import { createSupabaseServerClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Logger } from "next-axiom";
import { getTranslations } from "next-intl/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import Link from "next/link";
import { headers } from "next/headers";

interface PageProps {
  params: Promise<{
    companyId: string;
    jobId: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ConfirmEmailPage({
  params,
  searchParams,
}: PageProps) {
  const { companyId, jobId } = await params;
  const { interviewId } = (await searchParams) as { interviewId: string };

  const supabase = await createSupabaseServerClient();
  const logger = new Logger().with({
    function: "ConfirmEmailPage",
    companyId,
    jobId,
    interviewId,
  });

  const t = await getTranslations("apply");

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    logger.error("No user found on confirm email page");
    redirect(`/apply/company/${companyId}/job/${jobId}`);
  }

  // Fetch company info
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("*")
    .eq("id", companyId)
    .single();

  if (companyError || !company) {
    logger.error("Company not found", { companyId });
    redirect(`/apply/company/${companyId}/job/${jobId}`);
  }

  // Fetch job info
  const { data: job, error: jobError } = await supabase
    .from("custom_jobs")
    .select("*")
    .eq("id", jobId)
    .eq("company_id", companyId)
    .single();

  if (jobError || !job) {
    logger.error("Job not found", { jobId });
    redirect(`/apply/company/${companyId}/job/${jobId}`);
  }

  await logger.flush();

  // Server action to resend confirmation email
  async function resendConfirmationEmail() {
    "use server";
    const supabase = await createSupabaseServerClient();
    const t = await getTranslations("apply.confirmEmail.errors");
    const logger = new Logger().with({
      function: "resendConfirmationEmail",
    });

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error(t("noUserOrEmail"));
      }

      // For anonymous users, use the email from user metadata
      const userEmail = user.email || user.user_metadata?.user_entered_email_address;
      
      if (!userEmail) {
        throw new Error(t("noUserOrEmail"));
      }

      const origin = (await headers()).get("origin");
      const { error } = await supabase.auth.resend({
        type: "email_change",
        email: userEmail,
        options: {
          emailRedirectTo: `${origin}/apply/company/${companyId}/job/${jobId}/interview/${interviewId}`,
        },
      });

      if (error) {
        logger.error("Failed to resend confirmation email", { error });
        throw error;
      }

      logger.info("Confirmation email resent successfully");
    } catch (error) {
      logger.error("Error in resendConfirmationEmail", { error });
      throw error;
    } finally {
      await logger.flush();
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 text-blue-600">
              <Mail className="h-12 w-12" />
            </div>
            <CardTitle className="text-2xl">
              {t("confirmEmail.title")}
            </CardTitle>
            <CardDescription className="text-lg mt-2">
              {t("confirmEmail.description")}{" "}
              <span className="font-semibold">{user.email}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-semibold text-lg">{job.job_title}</p>
                <p className="text-gray-600">
                  {t("confirmEmail.at")} {company.name}
                </p>
              </div>

              <p className="text-sm text-gray-500">
                {t("confirmEmail.redirectInfo")}
              </p>
            </div>

            <div className="space-y-4">
              <form action={resendConfirmationEmail} className="w-full">
                <Button type="submit" variant="outline" className="w-full">
                  {t("confirmEmail.resendButton")}
                </Button>
              </form>

              <div className="text-center text-sm text-gray-500">
                <p>
                  {t("confirmEmail.cannotFindEmail")}{" "}
                  <Link
                    href={`/apply/company/${companyId}/job/${jobId}`}
                    className="text-blue-600 hover:underline"
                  >
                    {t("confirmEmail.returnToJobListing")}
                  </Link>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
