import { signInWithOTP } from "@/app/[locale]/(auth-pages)/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import SignInForm from "./SignInForm";

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const signUpT = await getTranslations("signUp");
  // If user is already signed in, show the already signed in UI
  if (user) {
    return (
      <div className="container max-w-md mx-auto pt-20">
        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold">
              {signUpT("alreadySignedIn.title")}
            </h1>
            <p className="text-muted-foreground">
              {signUpT("alreadySignedIn.description")}
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <Button asChild className="w-full">
              <Link href="/dashboard/jobs">
                {signUpT("alreadySignedIn.buttons.dashboard")}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <SignInForm />;
}
