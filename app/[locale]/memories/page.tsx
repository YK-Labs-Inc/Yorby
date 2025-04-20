import { createSupabaseServerClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import UserInfoPage from "./UserInfoPage";

export default async function AddInfo({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { onboarding } = await searchParams;

  return <UserInfoPage isOnboarding={onboarding === "true"} />;
}
