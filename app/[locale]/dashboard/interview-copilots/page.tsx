import { InterviewCopilotCreationForm } from "./InterviewCopilotCreationForm";
import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

const fetchUserCredits = async (userId: string) => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("custom_job_credits")
    .select("number_of_credits")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    throw error;
  }
  return data?.number_of_credits || 0;
};

export default async function InterviewCopilotsPage() {
  const t = await getTranslations("interviewCopilots");
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const userCredits = await fetchUserCredits(user.id);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t("createNew.title")}</h1>
        <p className="text-sm text-muted-foreground mt-2">
          {t("credits.subtitle", { credits: userCredits })}
        </p>
      </div>

      <Card>
        <CardContent className="px-2 py-4">
          <InterviewCopilotCreationForm />
        </CardContent>
      </Card>
    </div>
  );
}
