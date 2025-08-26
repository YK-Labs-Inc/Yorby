import OTPLoginForm from "./OTPLoginForm";
import { getServerUser } from "@/utils/auth/server";
import { redirect } from "next/navigation";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const redirectUrl = (await searchParams).redirect;
  const user = await getServerUser();
  if (user) {
    redirect(`${redirectUrl || "/auth-redirect"}`);
  }
  return <OTPLoginForm />;
}
