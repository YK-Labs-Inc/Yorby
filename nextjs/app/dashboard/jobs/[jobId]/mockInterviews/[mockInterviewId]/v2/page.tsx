import { headers } from "next/headers";
import { LiveKitInterviewComponent } from "./LiveKitInterviewComponent";
import { getAppConfig, getOrigin } from "./utils";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { posthog } from "@/utils/tracking/serverUtils";

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
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }
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
      jobId={jobId}
    />
  );
}
