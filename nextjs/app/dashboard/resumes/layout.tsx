import Chatwoot from "@/components/ChatwootWidget";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getServerUser } from "@/utils/auth/server";

export default async function ResumesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerUser();
  if (!user) {
    redirect("/sign-in");
  }
  return (
    <>
      {children}
      <Chatwoot />
    </>
  );
}
