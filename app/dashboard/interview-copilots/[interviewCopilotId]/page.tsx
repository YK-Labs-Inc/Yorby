import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Logger } from "next-axiom";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import EditableInterviewCopilot from "./EditableInterviewCopilot";
import { redirect } from "next/navigation";
import { FormMessage, Message } from "@/components/form-message";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";
import { linkAnonymousAccount } from "@/app/dashboard/jobs/[jobId]/actions";
import MobileWarning from "./MobileWarning";

const fetchInterviewCopilot = async (interviewCopilotId: string) => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("interview_copilots")
    .select("*, interview_copilot_files(*)")
    .eq("id", interviewCopilotId)
    .single();
  if (error) {
    const logger = new Logger().with({
      function: "fetchInterviewCopilot",
    });
    logger.error("Error fetching interview copilot", { error });
    await logger.flush();
    return { data: null };
  }
  return { data };
};

const fetchUserCredits = async (userId: string) => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("custom_job_credits")
    .select("number_of_credits")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    throw error;
  }
  return data?.number_of_credits || 0;
};

const fetchHasSubscription = async (userId: string) => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    throw error;
  }
  return data !== null;
};

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ interviewCopilotId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { interviewCopilotId } = await params;
  const { data: interviewCopilot } =
    await fetchInterviewCopilot(interviewCopilotId);
  const t = await getTranslations("interviewCopilots");
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/sign-in");
  }
  const isAnonymous = user.is_anonymous ?? true;

  const successMessage = (await searchParams)?.success as string | undefined;
  const errorMessage = (await searchParams)?.error as string | undefined;
  const message = (await searchParams)?.message as string | undefined;
  let formMessage: Message | undefined;
  if (successMessage) {
    formMessage = { success: successMessage };
  } else if (errorMessage) {
    formMessage = { error: errorMessage };
  } else if (message) {
    formMessage = { message: message };
  }

  if (interviewCopilot?.status === "complete") {
    redirect(`/dashboard/interview-copilots/${interviewCopilotId}/review`);
  }

  if (interviewCopilot?.deletion_status === "deleted") {
    redirect("/dashboard/interview-copilots");
  }

  if (!interviewCopilot) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">
            {t("errors.notFound.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("errors.notFound.description")}
          </p>
          <div className="pt-4">
            <Link href="/dashboard/interview-copilots">
              <Button>{t("errors.notFound.action")}</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Get user credits if the interview copilot is locked
  let userCredits = 0;
  if (interviewCopilot.interview_copilot_access === "locked") {
    userCredits = await fetchUserCredits(user.id);
  }
  const hasSubscription = await fetchHasSubscription(user?.id || "");
  const isLocked =
    interviewCopilot.interview_copilot_access === "locked" && !hasSubscription;

  return (
    <div className="container mx-auto px-4 py-8">
      <div
        className={`max-w-4xl mx-auto space-y-8 ${isAnonymous ? "h-full md:h-auto" : ""}`}
      >
        {isAnonymous ? (
          <div className="md mx-auto w-full">
            {(!formMessage || "error" in formMessage) && (
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-2">
                  {t("accountLinking.title")}
                </h2>
                <p className="text-muted-foreground mb-6">
                  {t("accountLinking.description")}
                </p>
                <form action={linkAnonymousAccount} className="space-y-4">
                  <Label htmlFor="email">
                    {t("accountLinking.form.email.label")}
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder={t("accountLinking.form.email.placeholder")}
                    required
                  />
                  <input
                    type="hidden"
                    name="interviewCopilotId"
                    value={interviewCopilotId}
                  />
                  <SubmitButton>{t("accountLinking.form.submit")}</SubmitButton>
                </form>
              </div>
            )}
            {formMessage && <FormMessage message={formMessage} />}
          </div>
        ) : (
          <>
            <div className="hidden md:block">
              <EditableInterviewCopilot interviewCopilot={interviewCopilot} />
            </div>
            <div className="block md:hidden">
              <MobileWarning />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
