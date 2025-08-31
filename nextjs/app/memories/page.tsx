import { createSupabaseServerClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import UserInfoPage from "./UserInfoPage";
import { getServerUser } from "@/utils/auth/server";

export default async function AddInfo({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await getServerUser();

  if (!user) {
    redirect("/login");
  }

  const { onboarding } = await searchParams;

  return <UserInfoPage isOnboarding={onboarding === "true"} />;
}
