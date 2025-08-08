import { APP_CONFIG_DEFAULTS } from "@/app/dashboard/jobs/[jobId]/mockInterviews/[mockInterviewId]/v2/app-config";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { checkApplicationStatus } from "../../actions";
import { InterviewComponent } from "./InterviewComponent";

interface PageProps {
  params: Promise<{
    companyId: string;
    jobId: string;
    candidateInterviewId: string;
  }>;
}

export default async function CandidateInterviewPage({ params }: PageProps) {
  const { companyId, jobId, candidateInterviewId } = await params;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/apply/company/${companyId}/job/${jobId}`);
  }

  if (user.is_anonymous) {
    redirect(
      `/apply/company/${companyId}/job/${jobId}/application/confirm-email?candidateInterviewId=${candidateInterviewId}`
    );
  }

  const result = await checkApplicationStatus(companyId, jobId, user.id);

  if (result.hasCompletedInterview) {
    redirect(`/apply/company/${companyId}/job/${jobId}/application/submitted`);
  }
  const { candidateJobInterviews } = result;

  // Find the current interview index and determine the next interview ID
  const currentIndex = candidateJobInterviews.findIndex(
    (interview) => interview.id === candidateInterviewId
  );
  const nextInterviewId =
    currentIndex !== -1 && currentIndex < candidateJobInterviews.length - 1
      ? candidateJobInterviews[currentIndex + 1].id
      : null;

  return (
    <InterviewComponent
      appConfig={APP_CONFIG_DEFAULTS}
      currentInterviewId={candidateInterviewId}
      nextInterviewId={nextInterviewId}
      jobId={jobId}
      companyId={companyId}
    />
  );
}
