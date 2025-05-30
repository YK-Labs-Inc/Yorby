"use server";

import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Logger } from "next-axiom";
import { getTranslations } from "next-intl/server";
import { revalidatePath } from "next/cache";

export async function verifyAnonymousUser(prevState: any, formData: FormData) {
  const captchaToken = formData.get("captchaToken") as string;
  const supabase = await createSupabaseServerClient();
  const t = await getTranslations("interviewCopilotDemo");
  const logger = new Logger().with({
    function: "verifyAnonymousUser",
    captchaToken,
  });
  try {
    const { data, error } = await supabase.auth.signInAnonymously({
      options: {
        captchaToken,
      },
    });

    if (error || !data) {
      logger.error("Error verifying anonymous user", { error });
      await logger.flush();
      return { error: t("errors.generic") };
    }
  } catch (error) {
    logger.error("Error verifying anonymous user", { error });
    await logger.flush();
    return { error: t("errors.generic") };
  }
  revalidatePath("/interview-copilot-demo");
}
