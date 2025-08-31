import { headers } from "next/headers";
import {
  getAppConfig,
  getOrigin,
} from "@/app/dashboard/jobs/[jobId]/mockInterviews/[mockInterviewId]/v2/utils";
import { LiveKitInterviewComponent } from "@/app/dashboard/jobs/[jobId]/mockInterviews/[mockInterviewId]/v2/LiveKitInterviewComponent";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { getServerUser } from "@/utils/auth/server";
import { redirect } from "next/navigation";
import { posthog } from "@/utils/tracking/serverUtils";

interface PageProps {
  params: Promise<{
    customJobId: string;
    mockInterviewId: string;
  }>;
}

export default async function LiveKitInterviewPage({ params }: PageProps) {
  const { customJobId, mockInterviewId } = await params;
  const hdrs = await headers();
  const origin = getOrigin(hdrs);
  const appConfig = await getAppConfig(origin);
  const user = await getServerUser();
  if (!user) {
    redirect("/login");
  }
  const supabase = await createSupabaseServerClient();
  const isLiveKitEnabled = Boolean(
    await posthog.isFeatureEnabled("enable-livekit", user.id)
  );
  if (!isLiveKitEnabled) {
    redirect("/");
  }
  return (
    <LiveKitInterviewComponent
      appConfig={appConfig}
      interviewType="mock-interview"
      mockInterviewId={mockInterviewId}
      jobId={customJobId}
    />
  );
}
