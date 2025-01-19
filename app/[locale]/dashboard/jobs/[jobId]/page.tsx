import { H1 } from "@/components/typography";
import { Link } from "@/i18n/routing";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PracticeQuestions from "./PracticeQuestions";
import MockInterview from "./MockInterview";
import { FormMessage, Message } from "@/components/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";
import { linkAnonymousAccount } from "./actions";
import { getTranslations } from "next-intl/server";

const fetchJob = async (jobId: string) => {
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
  if (data.status === "locked") {
    return {
      ...data,
      custom_job_questions: data.custom_job_questions.slice(0, 1),
    };
  }
  return {
    ...data,
    custom_job_questions: data.custom_job_questions.sort(
      (a: any, b: any) => a.created_at - b.created_at
    ),
  };
};

export default async function JobPage({
  params,
  searchParams,
}: {
  params: Promise<{ jobId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const jobId = (await params).jobId;
  const job = await fetchJob(jobId);
  const view = ((await searchParams)?.view as string) || "practice";
  const filter =
    ((await searchParams)?.filter as "all" | "complete" | "in_progress") ||
    "all";
  const message = (await searchParams) as Message;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  console.log(user);
  const isAnonymous = user?.is_anonymous;

  const t = await getTranslations("accountLinking");

  return (
    <div className="w-full flex flex-col my-8 mx-4 gap-6">
      <H1>
        {job.job_title
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")}{" "}
        Practice Interview Questions{" "}
      </H1>

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

      {isAnonymous ? (
        <div className="md mx-auto w-full bg-green-300">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-2">{t("title")}</h2>
            <p className="text-muted-foreground mb-6">{t("description")}</p>
            <form className="space-y-4">
              <div>
                <Label htmlFor="email">{t("form.email.label")}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={t("form.email.placeholder")}
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">{t("form.password.label")}</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder={t("form.password.placeholder")}
                  required
                />
              </div>
              <SubmitButton formAction={linkAnonymousAccount}>
                {t("form.submit")}
              </SubmitButton>
              <FormMessage message={message} />
            </form>
          </div>
        </div>
      ) : (
        <>
          {view === "practice" && (
            <PracticeQuestions
              jobId={jobId}
              questions={job.custom_job_questions}
              isLocked={job.status === "locked"}
            />
          )}
          {view === "mock" && <MockInterview jobId={jobId} filter={filter} />}
        </>
      )}
    </div>
  );
}
