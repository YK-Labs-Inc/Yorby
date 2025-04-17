import { createSupabaseServerClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import UserInfoPage from "./UserInfoPage";

export default async function AddInfo() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <UserInfoPage />;
}
