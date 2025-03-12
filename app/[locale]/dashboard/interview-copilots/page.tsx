import { InterviewCopilotCreationForm } from "./InterviewCopilotCreationForm";
import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { PlayCircle } from "lucide-react";

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
    redirect("/sign-in");
  }

  const userCredits = await fetchUserCredits(user.id);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Demo Section */}
      <Card className="mb-12 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50">
        <CardContent className="px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">
                {t("demo.title")}
              </h2>
              <p className="text-muted-foreground max-w-lg">
                {t("demo.description")}
              </p>
            </div>
            <Link href="/interview-copilot-demo" className="shrink-0">
              <Button size="lg" className="gap-2">
                <PlayCircle className="w-5 h-5" />
                {t("demo.button")}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Creation Form Section */}
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
