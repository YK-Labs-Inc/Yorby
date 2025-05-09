import AnswerForm from "./AnswerForm";
import { Tables } from "@/utils/supabase/database.types";
import { OnboardingWrapper } from "./OnboardingWrapper";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import BackButton from "./BackButton";

const fetchQuestion = async (questionId: string) => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("custom_job_questions")
    .select(`*, custom_job_question_submissions(*)`)
    .eq("id", questionId)
    .order("created_at", {
      ascending: false,
      referencedTable: "custom_job_question_submissions",
    })
    .single();

  if (error) {
    throw error;
  }
  return data;
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
  const lastSubmission =
    question.custom_job_question_submissions.length > 0
      ? question.custom_job_question_submissions[0]
      : null;
  let currentSubmission: Tables<"custom_job_question_submissions"> | undefined =
    submissionId
      ? question.custom_job_question_submissions.find(
          (submission) => submission.id === submissionId
        )
      : undefined;

  // Determine if we should show onboarding
  const showOnboarding =
    question.custom_job_question_submissions.length === 0 && // First question (no submissions)
    !question.custom_job_question_submissions.some(
      (submission) =>
        (submission.feedback as { pros: string[]; cons: string[] })?.pros
          .length > 0 ||
        (submission.feedback as { pros: string[]; cons: string[] })?.cons
          .length > 0
    ); // No generated answers yet

  return (
    <>
      <div className="max-w-[1080px] w-full mx-auto p-2 md:p-6 space-y-6">
        <BackButton jobId={jobId} />
        <AnswerForm
          jobId={jobId}
          question={question}
          submissions={question.custom_job_question_submissions}
          currentSubmission={currentSubmission ?? lastSubmission}
        />
      </div>
      <OnboardingWrapper showOnboarding={showOnboarding} />
    </>
  );
};

export default QuestionComponent;
