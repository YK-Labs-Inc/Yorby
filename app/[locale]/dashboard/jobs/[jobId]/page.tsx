import { H1 } from "@/components/typography";
import { Link } from "@/i18n/routing";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PracticeQuestions from "./PracticeQuestions";
import MockInterview from "./MockInterview";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";
import { linkAnonymousAccount } from "./actions";
import { getTranslations } from "next-intl/server";
import { FormMessage, Message } from "@/components/form-message";
import { GenerateInterviewQuestionsButton } from "./GenerateInterviewQuestionsButton";
import { Button } from "@/components/ui/button";
import { FileText, Monitor } from "lucide-react";
import { redirect } from "next/navigation";

const MobileWarning = async () => {
  const t = await getTranslations("mobileWarning");
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center gap-4 rounded-lg border bg-card text-card-foreground shadow-sm">
      <Monitor className="h-12 w-12 text-muted-foreground" />
      <h2 className="text-xl font-semibold">{t("title")}</h2>
      <p className="text-muted-foreground">{t("description")}</p>
    </div>
  );
};

const fetchJob = async (jobId: string, hasSubscription: boolean) => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("custom_jobs")
    .select(
      `*, 
      custom_job_questions(*, 
        custom_job_question_submissions(*))`
    )
    .eq("id", jobId)
    .order("created_at", { ascending: false })
    .single();
  if (error) {
    throw error;
  }
  if (data.status === "locked" && !hasSubscription) {
    return data;
  }
  return {
    ...data,
    custom_job_questions: data.custom_job_questions.sort(
      (a: any, b: any) => a.created_at - b.created_at
    ),
  };
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

export default async function JobPage({
  params,
  searchParams,
}: {
  params: Promise<{ jobId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/sign-in");
  }
  const isAnonymous = user?.is_anonymous;
  const jobId = (await params).jobId;
  const hasSubscription = await fetchHasSubscription(user?.id || "");
  const job = await fetchJob(jobId, hasSubscription);
  const userCredits = await fetchUserCredits(job.user_id);
  const view = ((await searchParams)?.view as string) || "practice";
  const filter =
    ((await searchParams)?.filter as "all" | "complete" | "in_progress") ||
    "all";
  const currentPage = parseInt((await searchParams)?.page as string) || 1;
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
  const t = await getTranslations("accountLinking");
  const isLocked = job.status === "locked" && !hasSubscription;

  return (
    <div
      className={`w-full flex flex-col justify-center items-center p-8 gap-6 ${
        isAnonymous ? "" : "h-full md:h-auto"
      }`}
    >
      <div
        className={`gap-6 w-full flex-col md:flex-row md:justify-between items-start md:items-center ${isAnonymous ? "flex" : "flex"}`}
      >
        <H1>
          {job.job_title
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")}{" "}
          Practice Interview Questions{" "}
        </H1>
        <Link href={`/dashboard/jobs/${jobId}/files`}>
          <Button variant="outline" className="gap-2">
            <FileText className="h-4 w-4" />
            Manage Files
          </Button>
        </Link>
      </div>

      {isAnonymous ? (
        <div className="md mx-auto w-full">
          {(!formMessage || "error" in formMessage) && (
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-2">{t("title")}</h2>
              <p className="text-muted-foreground mb-6">{t("description")}</p>
              <form action={linkAnonymousAccount} className="space-y-4">
                <Label htmlFor="email">{t("form.email.label")}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={t("form.email.placeholder")}
                  required
                />
                <input type="hidden" name="jobId" value={jobId} />
                <SubmitButton>{t("form.submit")}</SubmitButton>
              </form>
            </div>
          )}
          {formMessage && <FormMessage message={formMessage} />}
        </div>
      ) : (
        <>
          <div className="hidden md:flex flex-col gap-6 w-full">
            <div className="flex items-center justify-between w-full">
              <Tabs value={view} className="w-full">
                <TabsList>
                  <Link href={`?view=practice`} className="w-full">
                    <TabsTrigger value="practice" className="w-full">
                      Practice Questions
                    </TabsTrigger>
                  </Link>
                  <Link href={`?view=mock`} className="w-full">
                    <TabsTrigger value="mock" className="w-full">
                      Mock Interview
                    </TabsTrigger>
                  </Link>
                </TabsList>
              </Tabs>
              {view === "practice" && !isLocked && (
                <GenerateInterviewQuestionsButton jobId={jobId} />
              )}
            </div>
            {view === "practice" && (
              <PracticeQuestions
                jobId={jobId}
                questions={job.custom_job_questions}
                isLocked={isLocked}
                userCredits={userCredits}
                currentPage={currentPage}
                numFreeQuestions={3}
              />
            )}
            {view === "mock" && (
              <MockInterview
                jobId={jobId}
                filter={filter}
                userCredits={userCredits}
                isLocked={isLocked}
              />
            )}
          </div>
          <div className="md:hidden w-full flex flex-col justify-center items-center">
            <MobileWarning />
          </div>
        </>
      )}
    </div>
  );
}
