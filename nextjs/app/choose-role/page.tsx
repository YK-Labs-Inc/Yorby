import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { getTranslations } from "next-intl/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserIcon, UsersIcon } from "lucide-react";
import { getServerUser } from "@/utils/auth/server";

export default async function ChooseRolePage() {
  // Authentication check
  const user = await getServerUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Check if user is actually a coach (for security)
  const supabase = await createSupabaseServerClient();
  const { data: coachData, error: coachError } = await supabase
    .from("coaches")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  // If user is not a coach, redirect to onboarding
  if (!coachData || coachError) {
    redirect("/onboarding");
  }

  // Get translations
  const t = await getTranslations("chooseRole");

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            {t("title")}
          </h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Job Prep Option */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/onboarding" className="block h-full">
              <CardHeader className="text-center">
                <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                  <UserIcon className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>{t("personalPrep.title")}</CardTitle>
                <CardDescription>
                  {t("personalPrep.description")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>{t("personalPrep.content")}</p>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Button variant="outline">{t("personalPrep.button")}</Button>
              </CardFooter>
            </Link>
          </Card>

          {/* Coaching Dashboard Option */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link
              href="/dashboard/coach-admin/programs"
              className="block h-full"
            >
              <CardHeader className="text-center">
                <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                  <UsersIcon className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>{t("programsDashboard.title")}</CardTitle>
                <CardDescription>
                  {t("programsDashboard.description")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>{t("programsDashboard.content")}</p>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Button variant="outline">
                  {t("programsDashboard.button")}
                </Button>
              </CardFooter>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
