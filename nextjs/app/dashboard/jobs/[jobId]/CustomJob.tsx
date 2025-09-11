import { H1 } from "@/components/typography";
import Link from "next/link";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { getServerUser } from "@/utils/auth/server";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MockInterview from "./MockInterview";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";
import { linkAnonymousAccount } from "./actions";
import { getTranslations } from "next-intl/server";
import { FormMessage, Message } from "@/components/form-message";
import { GenerateInterviewQuestionsButton } from "./GenerateInterviewQuestionsButton";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { redirect } from "next/navigation";
import PostHogClient from "@/app/posthog";
import { QuestionGenerationDropdown } from "./QuestionGenerationDropdown";
import PracticeQuestionsClientWrapper from "./PracticeQuestionsClientWrapper";
import Course from "./Course";
import type { Database } from "@/utils/supabase/database.types";

type CourseModule = Database["public"]["Tables"]["course_modules"]["Row"] & {
  course_lessons: (Database["public"]["Tables"]["course_lessons"]["Row"] & {
    course_lesson_blocks: Pick<
      Database["public"]["Tables"]["course_lesson_blocks"]["Row"],
      "id" | "block_type"
    >[];
  })[];
};

type Course = Database["public"]["Tables"]["courses"]["Row"] & {
  course_modules: CourseModule[];
};

const fetchJob = async (jobId: string) => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("custom_jobs")
    .select(
      `*, 
      custom_job_questions(*, 
        custom_job_question_submissions(*)
      ),
      courses(
        *,
        course_modules(
          *,
          course_lessons(
            *,
            course_lesson_blocks(id, block_type)
          )
        )
      )`
    )
    .eq("id", jobId)
    .order("created_at", { ascending: false })
    .single();
  if (error) {
    throw error;
  }

  // Process course data
  let processedCourse: Course | null = null;
  let processedModules: CourseModule[] = [];
  if (data.courses) {
    const course = data.courses as Course; // One-to-one relationship
    if (course.deletion_status === "not_deleted") {
      processedCourse = course;
      processedModules = course.course_modules
        .filter((m) => m.published === true)
        .sort((a, b) => a.order_index - b.order_index)
        .map((module) => ({
          ...module,
          course_lessons: module.course_lessons.sort(
            (a, b) => a.order_index - b.order_index
          ),
        }));
    }
  }
  return {
    ...data,
    custom_job_questions: data.custom_job_questions
      .filter((q) => q.publication_status === "published")
      .sort((a, b) => Number(b.created_at) - Number(a.created_at)),
    course: processedCourse,
    course_modules: processedModules,
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

export default async function CustomJob({
  jobId,
  searchParams,
  isMultiTenantExperience = false,
}: {
  jobId: string;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
  isMultiTenantExperience: boolean;
}) {
  const user = await getServerUser();
  if (!user) {
    redirect("/sign-in");
  }
  const isAnonymous = user?.is_anonymous;
  const job = await fetchJob(jobId);
  const userCredits = await fetchUserCredits(job.user_id);
  const view = ((await searchParams)?.view as string) || "practice";
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
  const hasCourse =
    job.course && job.course_modules && job.course_modules.length > 0;
  const posthog = PostHogClient();
  const isAnonymousAccountLinkingEnabled =
    (await posthog.getFeatureFlag(
      "optional-anonymous-account-linking",
      user.id
    )) === "control";
  const isSubscriptionVariant =
    (await posthog.getFeatureFlag(
      "subscription-price-test-1",
      user.id || ""
    )) === "test";
  const userSubmittedQuestionsEnabled = await posthog.isFeatureEnabled(
    "user-submitted-questions",
    user.id
  );

  const filter =
    ((await searchParams)?.filter as "all" | "complete" | "in_progress") ||
    "all";

  return (
    <div
      className={`w-full flex flex-col justify-center items-center p-4 sm:p-6 md:p-8 gap-4 sm:gap-6 ${
        isAnonymous ? "" : "h-full md:h-auto"
      }`}
    >
      <div
        className={`gap-4 sm:gap-6 w-full flex-col md:flex-row md:justify-between items-start md:items-center ${isAnonymous ? "flex" : "flex"}`}
      >
        <H1 className="text-xl sm:text-2xl md:text-3xl">
          {job.job_title
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")}{" "}
          Practice Interview Questions{" "}
        </H1>
        {!isMultiTenantExperience && (
          <Link href={`/dashboard/jobs/${jobId}/files`}>
            <Button
              variant="outline"
              className="gap-2 text-sm sm:text-base w-full sm:w-auto"
            >
              <FileText className="h-4 w-4" />
              <span>Manage Files</span>
            </Button>
          </Link>
        )}
      </div>

      {isAnonymous && isAnonymousAccountLinkingEnabled ? (
        <div className="md mx-auto w-full">
          {(!formMessage || "error" in formMessage) && (
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold mb-2">
                {t("title")}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
                {t("description")}
              </p>
              <form
                action={linkAnonymousAccount}
                className="space-y-3 sm:space-y-4"
              >
                <Label htmlFor="email" className="text-sm sm:text-base">
                  {t("form.email.label")}
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={t("form.email.placeholder")}
                  required
                />
                <input type="hidden" name="jobId" value={jobId} />
                <SubmitButton className="w-full">
                  {t("form.submit")}
                </SubmitButton>
              </form>
            </div>
          )}
          {formMessage && <FormMessage message={formMessage} />}
        </div>
      ) : (
        <div className="flex flex-col gap-4 sm:gap-6 w-full">
          <div className="flex flex-col md:flex-row items-start gap-3 sm:gap-4 md:items-center justify-between w-full">
            <Tabs value={view} className="w-full md:w-auto">
              <TabsList
                className={`grid w-full ${hasCourse ? "grid-cols-3" : "grid-cols-2"} md:w-auto`}
              >
                <Link href={`?view=practice`}>
                  <TabsTrigger
                    value="practice"
                    className="w-full text-xs sm:text-sm"
                  >
                    Practice Questions
                  </TabsTrigger>
                </Link>
                <Link href={`?view=mock`}>
                  <TabsTrigger
                    value="mock"
                    className="w-full text-xs sm:text-sm"
                  >
                    Mock Interview
                  </TabsTrigger>
                </Link>
                {hasCourse && (
                  <Link href={`?view=course`}>
                    <TabsTrigger
                      value="course"
                      className="w-full text-xs sm:text-sm"
                    >
                      Course
                    </TabsTrigger>
                  </Link>
                )}
              </TabsList>
            </Tabs>
            {!isMultiTenantExperience && (
              <>
                {view === "practice" &&
                  (userSubmittedQuestionsEnabled ? (
                    <QuestionGenerationDropdown jobId={jobId} job={job} />
                  ) : (
                    <GenerateInterviewQuestionsButton jobId={jobId} />
                  ))}
              </>
            )}
          </div>
          {view === "practice" && (
            <PracticeQuestionsClientWrapper
              jobId={jobId}
              questions={job.custom_job_questions}
              isLocked={false}
              userCredits={userCredits}
              currentPage={currentPage}
              numFreeQuestions={3}
              isSubscriptionVariant={isSubscriptionVariant}
              isMultiTenantExperience={isMultiTenantExperience}
            />
          )}
          {view === "mock" && (
            <MockInterview
              jobId={jobId}
              filter={filter}
              userCredits={userCredits}
              isLocked={false}
              isSubscriptionVariant={isSubscriptionVariant}
            />
          )}
          {view === "course" && hasCourse && (
            <Course
              course={job.course}
              modules={job.course_modules}
              jobId={jobId}
              isLocked={false}
            />
          )}
        </div>
      )}
    </div>
  );
}
