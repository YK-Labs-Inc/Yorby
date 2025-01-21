import { signInWithOTP } from "@/app/[locale]/(auth-pages)/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
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
    <form
      action={signInWithOTP}
      className="flex flex-col items-center justify-center w-full min-h-screen"
    >
      <h1 className="text-2xl font-medium">Sign in</h1>
      <div className="flex flex-col gap-2 [&>input]:mb-3 mt-8">
        <Label htmlFor="email">Email</Label>
        <Input
          name="email"
          type="email"
          placeholder="you@example.com"
          required
        />
        <SubmitButton pendingText="Sending magic link..." type="submit">
          Send Magic Link
        </SubmitButton>
        <p className="text-sm text-muted-foreground mt-2">
          We'll send you a magic link to your email. Click it to sign in
          instantly.
        </p>
        {formMessage && <FormMessage message={formMessage} />}
      </div>
    </form>
  );
}
