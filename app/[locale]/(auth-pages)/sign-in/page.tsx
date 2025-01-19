import { signInWithOTP } from "@/app/[locale]/(auth-pages)/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/routing";

export default async function Login(props: { searchParams: Promise<Message> }) {
  const searchParams = await props.searchParams;
  return (
    <form action={signInWithOTP} className="flex-1 flex flex-col min-w-64">
      <h1 className="text-2xl font-medium">Sign in</h1>
      <p className="text-sm text-foreground">
        Don't have an account?{" "}
        <Link className="text-foreground font-medium underline" href="/sign-up">
          Sign up
        </Link>
      </p>
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
        <FormMessage message={searchParams} />
        <p className="text-sm text-muted-foreground mt-2">
          We'll send you a magic link to your email. Click it to sign in
          instantly.
        </p>
      </div>
    </form>
  );
}
