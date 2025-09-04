import { getServerUser } from "@/utils/auth/server";
import SignInForm from "./SignInForm";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const redirectUrl = (await searchParams).redirect as string;
  const user = await getServerUser();
  const origin = (await headers()).get("origin");
  const isYorbyCoaching =
    origin?.includes("app.yorby.ai") ||
    process.env.NEXT_PUBLIC_IS_YORBY === "true";
  if (user) {
    redirect(
      `${redirectUrl || (isYorbyCoaching ? "/coaches/auth" : "/dashboard/jobs?newJob=true")}`
    );
  }
  return <SignInForm redirectUrl={redirectUrl} />;
}
