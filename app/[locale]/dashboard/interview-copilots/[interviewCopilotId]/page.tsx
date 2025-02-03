import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Logger } from "next-axiom";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { DeviceComparisonModal } from "./DeviceComparisonModal";

const fetchInterviewCopilot = async (interviewCopilotId: string) => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("interview_copilots")
    .select("*")
    .eq("id", interviewCopilotId)
    .single();
  if (error) {
    const logger = new Logger().with({
      function: "fetchInterviewCopilot",
    });
    logger.error("Error fetching interview copilot", { error });
    await logger.flush();
    throw error;
  }
  return data;
};

export default async function Page({
  params,
}: {
  params: Promise<{ interviewCopilotId: string }>;
}) {
  const { interviewCopilotId } = await params;
  const interviewCopilot = await fetchInterviewCopilot(interviewCopilotId);
  const t = await getTranslations("interviewCopilots");

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-foreground">
        {interviewCopilot.title}
      </h1>

      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="grid grid-cols-2 gap-8">
          <Link
            href={`/dashboard/interview-copilots/${interviewCopilot.id}/same-device`}
            className="flex flex-col items-center justify-center p-8 border border-border rounded-lg bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground transition-colors shadow-sm hover:shadow-md"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <span className="text-lg font-medium">
              {t("deviceSelection.sameDevice.title")}
            </span>
          </Link>

          <Link
            href={`/dashboard/interview-copilots/${interviewCopilot.id}/separate-device`}
            className="flex flex-col items-center justify-center p-8 border border-border rounded-lg bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground transition-colors shadow-sm hover:shadow-md"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            <span className="text-lg font-medium">
              {t("deviceSelection.separateDevice.title")}
            </span>
          </Link>
        </div>

        <DeviceComparisonModal />
      </div>
    </div>
  );
}
