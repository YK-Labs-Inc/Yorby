import { LiveKitInterviewComponent } from "@/app/dashboard/jobs/[jobId]/mockInterviews/[mockInterviewId]/v2/LiveKitInterviewComponent";
import { APP_CONFIG_DEFAULTS } from "@/app/dashboard/jobs/[jobId]/mockInterviews/[mockInterviewId]/v2/app-config";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { checkApplicationStatus } from "../../actions";

interface PageProps {
  params: Promise<{
    companyId: string;
    jobId: string;
    interviewId: string;
  }>;
}

export default async function InterviewPage({ params }: PageProps) {
  const { companyId, jobId, interviewId } = await params;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/apply/company/${companyId}/job/${jobId}`);
  }

  if (user.is_anonymous) {
    redirect(
      `/apply/company/${companyId}/job/${jobId}/application/confirm-email?interviewId=${interviewId}`
    );
  }

  const result = await checkApplicationStatus(companyId, jobId, user.id);

  if (result.hasCompletedInterview) {
    redirect(`/apply/company/${companyId}/job/${jobId}/application/submitted`);
  }

  return (
    <LiveKitInterviewComponent
      appConfig={APP_CONFIG_DEFAULTS}
      interviewType="real-interview"
      mockInterviewId={interviewId}
      jobId={jobId}
      companyId={companyId}
    />
  );
}
