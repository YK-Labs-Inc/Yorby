import { signInWithOTP } from "@/app/[locale]/(auth-pages)/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

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
  const signInT = await getTranslations("signIn");
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

  const successMessage = (await searchParams)?.success as string | undefined;
  const errorMessage = (await searchParams)?.error as string | undefined;
  const message = (await searchParams)?.message as string | undefined;
  let formMessage: Message | undefined;
  if (successMessage) {
    formMessage = { success: successMessage };
  } else if (errorMessage) {
    formMessage = { error: errorMessage };
  } else if (message) {
    formMessage = { message: message };
  }

  return (
    <div className="container max-w-md mx-auto pt-20">
      <form action={signInWithOTP} className="space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">{signInT("title")}</h1>
          <p className="text-muted-foreground">{signInT("description")}</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{signInT("form.email.label")}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder={signInT("form.email.placeholder")}
              required
            />
          </div>
          <SubmitButton
            pendingText={signInT("form.submitting")}
            type="submit"
            className="w-full"
          >
            {signInT("form.submit")}
          </SubmitButton>
          {formMessage && <FormMessage message={formMessage} />}
        </div>
      </form>
    </div>
  );
}
