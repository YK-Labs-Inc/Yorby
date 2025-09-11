import { headers } from "next/headers";
import { LiveKitInterviewComponent } from "./LiveKitInterviewComponent";
import { getAppConfig, getOrigin } from "./utils";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { getServerUser } from "@/utils/auth/server";
import { redirect } from "next/navigation";
import { posthog } from "@/utils/tracking/serverUtils";
import { InterviewComponent } from "@/app/apply/company/[companyId]/job/[jobId]/candidate-interview/[candidateInterviewId]/InterviewComponent";

interface PageProps {
  params: Promise<{
    jobId: string;
    mockInterviewId: string;
  }>;
}

export default async function LiveKitInterviewPage({ params }: PageProps) {
  const { jobId, mockInterviewId } = await params;
  const hdrs = await headers();
  const origin = getOrigin(hdrs);
  const appConfig = await getAppConfig(origin);
  const user = await getServerUser();
  if (!user) {
    redirect("/login");
  }
  const isLiveKitEnabled = Boolean(
    await posthog.isFeatureEnabled("enable-livekit", user.id)
  );
  if (!isLiveKitEnabled) {
    redirect("/");
  }

  const supabase = await createSupabaseServerClient();
  const { data: feedback } = await supabase
    .from("custom_job_mock_interview_feedback")
    .select("*")
    .eq("mock_interview_id", mockInterviewId)
    .single();

  if (feedback) {
    redirect(
      `/dashboard/jobs/${jobId}/mockInterviews/${mockInterviewId}/review/v2`
    );
  }
  return (
    <InterviewComponent
      appConfig={appConfig}
      jobInterviewType="general"
      interviewType="mock"
      mockInterviewId={mockInterviewId}
      jobId={jobId}
      enableSimliAvatar={false}
    />
  );
}
