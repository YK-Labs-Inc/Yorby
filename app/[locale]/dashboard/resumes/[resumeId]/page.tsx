import { createSupabaseServerClient } from "@/utils/supabase/server";
import ResumeBuilder from "../components/ResumeBuilder";
import { redirect } from "next/navigation";
import { Logger } from "next-axiom";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { getTranslations } from "next-intl/server";

const fetchUserCredits = async (userId: string) => {
  const logger = new Logger().with({
    function: "fetchUserCredits",
    userId,
  });
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("custom_job_credits")
    .select("number_of_credits")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    logger.error("Error fetching user credits", { error });
    return 0;
  }
  return data?.number_of_credits || 0;
};

const fetchHasSubscription = async (userId: string) => {
  const logger = new Logger().with({
    function: "fetchHasSubscription",
    userId,
  });
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    logger.error("Error fetching has subscription", { error });
    return false;
  }
  return data !== null;
};

const fetchResume = async (resumeId: string) => {
  const logger = new Logger().with({
    function: "fetchResume",
    resumeId,
  });
  const supabase = await createSupabaseServerClient();
  const { data: resumeData, error: resumeError } = await supabase
    .from("resumes")
    .select("*")
    .eq("id", resumeId)
    .single();
  if (resumeError) {
    logger.error("Error fetching resume", { error: resumeError });
    return null;
  }
  return resumeData;
};

export default async function ResumePage({
  params,
}: {
  params: Promise<{ resumeId: string }>;
}) {
  const t = await getTranslations("resumeBuilder");
  const resumeId = (await params).resumeId;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/sign-in");
  }
  const resume = await fetchResume(resumeId);
  if (!resume) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">
            {t("errors.notFound.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("errors.notFound.description")}
          </p>
          <div className="pt-4">
            <Link href="/dashboard/resumes">
              <Button>{t("errors.notFound.action")}</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }
  const hasSubscription = await fetchHasSubscription(user?.id || "");
  const credits = await fetchUserCredits(user?.id || "");
  const isAnonymous = user?.is_anonymous ?? true;
  return (
    <ResumeBuilder
      resumeId={resumeId}
      hasSubscription={hasSubscription}
      isAnonymous={isAnonymous}
      credits={credits}
    />
  );
}
