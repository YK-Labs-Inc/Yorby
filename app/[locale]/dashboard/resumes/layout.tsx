import { createSupabaseServerClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function ResumesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/sign-in");
  }
  return <>{children}</>;
}
