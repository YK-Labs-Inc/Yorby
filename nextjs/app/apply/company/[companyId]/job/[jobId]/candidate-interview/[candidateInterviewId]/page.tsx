import { APP_CONFIG_DEFAULTS } from "@/app/dashboard/jobs/[jobId]/mockInterviews/[mockInterviewId]/v2/app-config";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { getServerUser } from "@/utils/auth/server";
import { notFound, redirect } from "next/navigation";
import { checkApplicationStatus } from "../../actions";
import { InterviewComponent } from "./InterviewComponent";
import { GenerateAnalysisClient } from "./GenerateAnalysisClient";
import { posthog } from "@/utils/tracking/serverUtils";

const fetchJobInterviewQuestions = async (interviewId: string) => {
  const supabase = await createSupabaseServerClient();
  const { data: jobInterviewQuestions, error: jobInterviewQuestionsError } =
    await supabase
      .from("job_interview_questions")
      .select("*")
      .eq("interview_id", interviewId);

  if (jobInterviewQuestionsError) {
    throw new Error("Failed to fetch job interview questions");
  }

  const { data: questionDetails, error: questionDetailsError } = await supabase
    .from("company_interview_question_bank")
    .select(
      `
      id, 
      question,
      company_interview_coding_question_metadata (
        time_limit_ms
      )
    `
    )
    .in(
      "id",
      jobInterviewQuestions.map((question) => question.question_id)
    );

  if (questionDetailsError) {
    throw new Error("Failed to fetch question details");
  }

  return questionDetails;
};

interface PageProps {
  params: Promise<{
    companyId: string;
    jobId: string;
    candidateInterviewId: string;
  }>;
}

export default async function CandidateInterviewPage({ params }: PageProps) {
  const { companyId, jobId, candidateInterviewId } = await params;

  const user = await getServerUser();

  if (!user) {
    redirect(`/apply/company/${companyId}/job/${jobId}`);
  }

  if (user.is_anonymous) {
    redirect(
      `/apply/company/${companyId}/job/${jobId}/application/confirm-email?interviewId=${candidateInterviewId}`
    );
  }

  const result = await checkApplicationStatus(companyId, jobId, user.id);

  const {
    candidateJobInterviews,
    application,
    hasGeneratedAggregatedAnalysisForAllInterviews,
    hasCompletedInterview,
  } = result;

  if (hasCompletedInterview && hasGeneratedAggregatedAnalysisForAllInterviews) {
    redirect(`/apply/company/${companyId}/job/${jobId}/application/submitted`);
  }

  if (!application?.id) {
    return notFound();
  }

  if (
    hasCompletedInterview &&
    !hasGeneratedAggregatedAnalysisForAllInterviews
  ) {
    return (
      <GenerateAnalysisClient
        candidateId={application.id}
        companyId={companyId}
        jobId={jobId}
      />
    );
  }

  const currentInterview = candidateJobInterviews.find(
    (interview) => interview.id === candidateInterviewId
  );

  if (!currentInterview) {
    return notFound();
  }

  const questionDetails = await fetchJobInterviewQuestions(
    currentInterview.interview_id
  );
  // Find the current interview index and determine the next interview ID
  const currentIndex = candidateJobInterviews.findIndex(
    (interview) => interview.id === candidateInterviewId
  );
  const nextInterviewId =
    currentIndex !== -1 && currentIndex < candidateJobInterviews.length - 1
      ? candidateJobInterviews[currentIndex + 1].id
      : null;

  const enableSimliAvatar =
    (await posthog.isFeatureEnabled("enable-simli-avatar", user.id)) ?? false;

  return (
    <InterviewComponent
      appConfig={APP_CONFIG_DEFAULTS}
      currentInterviewId={candidateInterviewId}
      nextInterviewId={nextInterviewId}
      jobId={jobId}
      companyId={companyId}
      candidateId={application.id}
      jobInterviewType={currentInterview.interview_type}
      interviewType="candidate"
      questionDetails={questionDetails}
      enableSimliAvatar={enableSimliAvatar}
    />
  );
}
