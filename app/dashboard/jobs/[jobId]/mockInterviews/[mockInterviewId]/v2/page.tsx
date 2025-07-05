import { headers } from "next/headers";
import { LiveKitInterviewComponent } from "./LiveKitInterviewComponent";
import { getAppConfig, getOrigin } from "./utils";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { posthog } from "@/utils/tracking/serverUtils";

export default async function LiveKitInterviewPage() {
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
  return <LiveKitInterviewComponent appConfig={appConfig} />;
}
