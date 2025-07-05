"use server";

import {
  createAdminClient,
  createSupabaseServerClient,
} from "@/utils/supabase/server";
import { trackServerEvent } from "@/utils/tracking/serverUtils";
import { Logger } from "next-axiom";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

export const fetchDemoJob = async (demoJobId: string) => {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("demo_jobs")
    .select("*")
    .eq("id", demoJobId)
    .single();
  if (error) {
    return null;
  }
  return data;
};

export const cloneDemoJob = async (prevState: any, data: FormData) => {
  const t = await getTranslations("demoJobs");
  const demoJobId = data.get("demoJobId") as string;
  const captchaToken = data.get("captchaToken") as string;

  if (!demoJobId) {
    return { error: t("errors.demoJobNotFound") };
  }

  if (!captchaToken) {
    return { error: t("errors.captchaRequired") };
  }

  const supabase = await createSupabaseServerClient();
  const logger = new Logger().with({ demoJobId });
  let customJobId = "";
  let userId = "";
  try {
    // Authenticate user
    const loggedInUserId = (await supabase.auth.getUser()).data.user?.id;
    if (!loggedInUserId) {
      const { data, error } = await supabase.auth.signInAnonymously({
        options: {
          captchaToken,
        },
      });
      if (error) {
        logger.error("Error authenticating user", { error: error.message });
        await logger.flush();
        return { error: t("errors.pleaseTryAgain") };
      }
      if (!data.user?.id) {
        logger.error("User ID not found");
        await logger.flush();
        return { error: t("errors.pleaseTryAgain") };
      }
      userId = data.user?.id;
    } else {
      userId = loggedInUserId;
    }

    // Fetch demo job
    const { data: demoJob, error: demoJobError } = await supabase
      .from("demo_jobs")
      .select("*")
      .eq("id", demoJobId)
      .single();

    if (demoJobError || !demoJob) {
      return { error: t("errors.demoJobNotFound") };
    }

    // Create custom job
    const { data: customJob, error: customJobError } = await supabase
      .from("custom_jobs")
      .insert({
        job_title: demoJob.job_title,
        job_description: demoJob.job_description,
        company_name: demoJob.company_name,
        company_description: demoJob.company_description,
        user_id: userId,
        status: "locked",
      })
      .select()
      .single();

    if (customJobError || !customJob) {
      return { error: t("errors.pleaseTryAgain") };
    }
    customJobId = customJob.id;

    // Fetch demo job questions
    const { data: demoQuestions, error: demoQuestionsError } = await supabase
      .from("demo_job_questions")
      .select("*")
      .eq("custom_job_id", demoJobId);

    if (demoQuestionsError) {
      return { error: t("errors.pleaseTryAgain") };
    }

    // Clone questions
    if (demoQuestions && demoQuestions.length > 0) {
      const questionsToInsert = demoQuestions.map((q) => ({
        custom_job_id: customJob.id,
        question: q.question,
        answer_guidelines: q.answer_guidelines,
      }));

      const { error: insertQuestionsError } = await supabase
        .from("custom_job_questions")
        .insert(questionsToInsert);

      if (insertQuestionsError) {
        return {
          error: t("errors.pleaseTryAgain"),
        };
      }
    }

    await trackServerEvent({
      eventName: "demo_job_cloned",
      userId,
      args: {
        demoJobId,
      },
    });
  } catch (error: any) {
    logger.error("Error cloning demo job", { error: error.message });
    await logger.flush();
    return {
      error: t("errors.pleaseTryAgain"),
    };
  }

  if (!customJobId) {
    return { error: t("errors.pleaseTryAgain") };
  }
  redirect(`/dashboard/jobs/${customJobId}`);
};
