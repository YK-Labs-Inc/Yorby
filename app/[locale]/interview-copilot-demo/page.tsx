import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Logger } from "next-axiom";
import { getTranslations } from "next-intl/server";
import InterviewCopilotDemoClientComponent from "./InterviewCopilotDemoClientComponent";

const fetchDemoVideo = async () => {
  const logger = new Logger().with({ function: "fetchDemoVideo" });
  try {
    const supabase = await createSupabaseServerClient();
    const { data: signedUrl, error } = await supabase.storage
      .from("assets")
      .createSignedUrl("interview-copilot-demo.mp4", 60 * 60); // URL valid for 1 hour

    if (error) {
      logger.error("Error generating signed URL:", { error });
      await logger.flush();
      return null;
    }

    return signedUrl;
  } catch (error) {
    logger.error("Error fetching demo video:", { error });
    await logger.flush();
    return null;
  }
};

export default async function InterviewCopilotDemo() {
  const signedUrl = await fetchDemoVideo();
  if (!signedUrl) {
    const t = await getTranslations("interviewCopilotDemo.errors");
    return <div>{t("generic")}</div>;
  }
  return (
    <InterviewCopilotDemoClientComponent signedUrl={signedUrl.signedUrl} />
  );
}
