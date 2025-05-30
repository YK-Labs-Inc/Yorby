import AnswerForm from "./AnswerForm";
import { Tables } from "@/utils/supabase/database.types";
import { OnboardingWrapper } from "./OnboardingWrapper";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import BackButton from "./BackButton";
import { Logger } from "next-axiom";
import { notFound, redirect } from "next/navigation";

const fetchQuestion = async (questionId: string) => {
  const supabase = await createSupabaseServerClient();
  const logger = new Logger().with({ function: "fetchQuestion", questionId });
  const { data, error } = await supabase
    .from("custom_job_questions")
    .select(
      `
      *,
      custom_job_question_submissions(
        *,
        custom_job_question_submission_feedback(*)
      )
    `
    )
    .eq("id", questionId)
    .order("created_at", {
      ascending: false,
      referencedTable: "custom_job_question_submissions",
    })
    .single();

  if (error) {
    logger.error("Failed fetching question", { error });
    await logger.flush();
    return null;
  }
  return data;
};

const fetchQuestionSampleAnswers = async (sourceQuestionId: string) => {
  const supabase = await createSupabaseServerClient();
  const logger = new Logger().with({
    function: "fetchQuestionSampleAnswers",
    sourceQuestionId,
  });
  const { data, error } = await supabase
    .from("custom_job_question_sample_answers")
    .select("*")
    .eq("question_id", sourceQuestionId);
  if (error) {
    logger.error("Failed fetching question sample answers", { error });
    await logger.flush();
    return [];
  }
  logger.info("Fetched question sample answers", { data });
  return data;
};

const checkOnboardingStatus = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  // Check if user has viewed the onboarding
  const hasViewedOnboarding =
    user.app_metadata?.["viewed_question_answer_onboarding"];

  // Show onboarding if the flag doesn't exist or is false
  return !hasViewedOnboarding;
};

const fetchCoachUserIdFromJobId = async (jobId: string) => {
  const supabase = await createSupabaseServerClient();
  const logger = new Logger().with({
    function: "fetchCoachUserIdFromJobId",
    jobId,
  });
  const { data, error } = await supabase
    .from("custom_jobs")
    .select("coach_id")
    .eq("id", jobId)
    .maybeSingle();
  if (error || !data) {
    logger.error("Failed fetching custom_job", { error });
    await logger.flush();
    throw error;
  }
  const coachId = data.coach_id;
  if (!coachId) {
    return null;
  }
  const { data: coachUser, error: coachUserError } = await supabase
    .from("coaches")
    .select("user_id")
    .eq("id", coachId)
    .single();
  if (coachUserError) {
    logger.error("Failed fetching coach user id from coach id", {
      error: coachUserError,
    });
    await logger.flush();
    throw coachUserError;
  }
  return coachUser.user_id;
};

const QuestionComponent = async ({
  questionId,
  jobId,
  submissionId,
}: {
  questionId: string;
  jobId: string;
  submissionId?: string;
}) => {
  const question = await fetchQuestion(questionId);
  if (!question) {
    notFound();
  }
  let sampleAnswers: Tables<"custom_job_question_sample_answers">[] = [];
  if (question.source_custom_job_question_id) {
    sampleAnswers = await fetchQuestionSampleAnswers(
      question.source_custom_job_question_id
    );
  }
  const lastSubmission =
    question.custom_job_question_submissions.length > 0
      ? question.custom_job_question_submissions[0]
      : null;
  let currentSubmission:
    | (Tables<"custom_job_question_submissions"> & {
        custom_job_question_submission_feedback: Tables<"custom_job_question_submission_feedback">[];
      })
    | undefined = submissionId
    ? question.custom_job_question_submissions.find(
        (submission) => submission.id === submissionId
      )
    : undefined;

  const coachUserId = await fetchCoachUserIdFromJobId(jobId);

  // Check if we should show onboarding based on user metadata
  const showOnboarding = await checkOnboardingStatus();

  return (
    <>
      <div className="max-w-[1080px] w-full mx-auto p-2 md:p-6 space-y-6">
        <BackButton jobId={jobId} />
        <AnswerForm
          jobId={jobId}
          question={question}
          submissions={question.custom_job_question_submissions}
          currentSubmission={currentSubmission ?? lastSubmission}
          sampleAnswers={sampleAnswers}
          coachUserId={coachUserId}
        />
      </div>
      <OnboardingWrapper showOnboarding={showOnboarding} />
    </>
  );
};

export default QuestionComponent;
